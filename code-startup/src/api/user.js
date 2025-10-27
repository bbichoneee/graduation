// src/api/user.js
import axios from "axios";
import { http } from "./http";

// http.js와 동일한 환경값을 사용
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 로컬 토큰 유틸( http.js 의 tokenStore와 동작 일치 )
function getAccess() {
  return localStorage.getItem("accessToken") || "";
}
function setTokens(access, refresh) {
  if (access) localStorage.setItem("accessToken", access);
  if (refresh !== undefined && refresh !== null) {
    if (refresh) localStorage.setItem("refreshToken", refresh);
    else localStorage.removeItem("refreshToken");
  }
}

/**
 * 백엔드 규약 (네가 준 원문 기준):
 * - POST /api/auth/refresh
 *   - Body: { refreshToken } (없어도 HttpOnly 쿠키로 처리 가능)
 *   - Response Body: { accessToken, tokenType: "Bearer" }
 *   - Response Header: X-Refresh-Token = 새 refresh 토큰
 *   - Set-Cookie: refresh_token=... (HttpOnly, SameSite=None)
 */
async function forceRefreshOnce() {
  // 인터셉터를 타면 무한루프 위험 → axios 기본 클라이언트 사용
  const rt = localStorage.getItem("refreshToken") || null; // 없어도 쿠키로 처리됨
  const res = await axios.post(
    `${API_BASE}/api/auth/refresh`,
    { refreshToken: rt ?? null },
    { withCredentials: true }
  );

  const data = res.data || {};
  const headerRefresh =
    res.headers?.["x-refresh-token"] ??
    res.headers?.["X-Refresh-Token"] ??
    null;

  const nextAccess = data.accessToken || data.access_token || null;
  const nextRefresh =
    headerRefresh ??
    data.refreshToken ??
    data.refresh_token ??
    undefined;

  if (!nextAccess) {
    throw new Error("REFRESH_SUCCEEDED_BUT_NO_ACCESS");
  }

  // 저장
  setTokens(nextAccess, nextRefresh);

  // 진단 로그 (원하면 주석 처리)
  console.log(
    "[forceRefreshOnce] access=",
    nextAccess.slice(0, 24) + "...",
    "refresh(header?)=",
    headerRefresh ? "(header)" : "(none/body/keep)"
  );

  return nextAccess;
}

/**
 * 강제 리프레시 후 /api/users/me 호출 (진단/우회용)
 * - 인터셉터를 신뢰하지 않고 순차적으로 보장
 */
export async function fetchCurrentUser() {
  // 1) access 없으면 바로 리프레시 시도
  let access = getAccess();
  if (!access) {
    try {
      access = await forceRefreshOnce();
    } catch (e) {
      // 새로고침이 안 되면 그대로 실패
      throw e;
    }
  }

  // 2) 새 access로 me 호출
  try {
    const res = await axios.get(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${access}` },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    // 3) 그래도 401이면 한 번 더 리프레시 후 재시도 (회전 중 엣지케이스 방지)
    if (err?.response?.status === 401) {
      try {
        const newAccess = await forceRefreshOnce();
        const res2 = await axios.get(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${newAccess}` },
          withCredentials: true,
        });
        return res2.data;
      } catch (e2) {
        // 최종 실패 → 원본 에러 던짐 (컴포넌트에서 메시지 처리)
        throw e2;
      }
    }
    throw err;
  }
}

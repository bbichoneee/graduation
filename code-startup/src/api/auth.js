// src/api/auth.js
import axios from "axios";
import { http, tokenStore, ensureAccessToken } from "./http";
import { mockSignup, mockLogin, mockMe } from "../mocks/mockAuth";

const { USE_MOCK, setTokens, getAccess } = tokenStore;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/** 회원가입 */
export async function signUp(payload) {
  if (USE_MOCK) return mockSignup(payload);

  const sanitized = sanitizeSignupPayload(payload);
  try {
    const res = await http.post("/api/auth/signup", sanitized);
    return res.data ?? {};
  } catch (err) {
    const status = err?.response?.status ?? "";
    const msg = err?.response?.data
      ? typeof err.response.data === "string"
        ? err.response.data
        : JSON.stringify(err.response.data)
      : "";
    throw new Error(`회원가입 실패 ${status}${msg ? `: ${msg}` : ""}`);
  }
}

/** 로그인: 이전 토큰 완전 제거 → 새 토큰 저장 */
export async function login(payload) {
  // 1) 혹시 남아있는 이전 토큰 제거 (섞임 방지)
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  // 2) 실제 로그인
  const res = await http.post("/api/auth/login", payload);
  const data = res.data || {};

  // 3) 새 토큰 추출
  const accessToken =
    data.accessToken ??
    data.access_token ??
    null;

  const headerRt =
    res.headers?.["x-refresh-token"] ??
    res.headers?.["X-Refresh-Token"] ??
    null;

  // 4) 저장
  setTokens(accessToken, headerRt ?? data.refreshToken ?? data.refresh_token ?? null);

  // 5) 저장 검증
  const savedAT = localStorage.getItem("accessToken") || "";
  return { ok: !!savedAT, accessToken: savedAT, raw: data };
}

/** 내 정보 조회 */
export async function fetchMe() {
  if (USE_MOCK) return mockMe(getAccess());
  const res = await http.get("/api/users/me");
  return res.data;
}

/**
 * 로그아웃: 서버에 알리고 로컬 토큰도 모두 제거
 */
export async function logout() {
  try {
    // 백엔드에서 /api/auth/logout이 permitAll()로 설정되었으므로,
    // Access Token은 필요 없으며, http 인스턴스의 withCredentials: true 설정으로
    // Refresh Token 쿠키만 자동으로 전송되면 됨.
    await http.post("/api/auth/logout", {});
  } catch (e) {
    console.warn("Logout API call failed, proceeding with local logout.", e);
  } finally {
    // API 호출 성공 여부와 관계없이 로컬 토큰 정리
    logoutLocal();
  }
}


/** 로컬 로그아웃(스토리지 초기화) */
export function logoutLocal() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

/** 회원가입 페이로드 정리 */
function sanitizeSignupPayload(p) {
  const t = (s) => (typeof s === "string" ? s.trim() : s);
  let username = t(p.username);
  let password = t(p.password);
  let nickname = t(p.nickname);
  // profileImageUrl은 MakeProfile에서 이미 처리되었으므로 그대로 사용
  // null 또는 외부 URL이 올 수 있음
  let profileImageUrl = p.profileImageUrl; // No trimming here, keep as is (null or string)

  // 닉네임 보정
  if (!nickname || nickname === "사용자" || nickname.length < 2) {
    nickname = `사용자_${Math.random().toString(36).slice(2, 6)}`;
  }
  return { username, password, nickname, profileImageUrl };
}

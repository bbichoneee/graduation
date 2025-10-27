// src/api/user.js
import { http, ensureAccessToken } from "./http";

/**
 * 현재 사용자 조회
 * - AT가 없으면 ensureAccessToken()이 쿠키 기반 refresh 1회
 * - 그래도 401이면 한번 더 AT 확보 후 재시도
 * - 더 실패하면 그대로 에러 던짐
 */
export async function fetchCurrentUser() {
  // 1) 먼저 AT 보장 (없으면 쿠키로 refresh 1회)
  await ensureAccessToken();

  try {
    // 2) 보호 API 호출은 http 인스턴스로 (인터셉터가 Authorization 붙임)
    const res = await http.get("/api/users/me", { withCredentials: true });
    return res.data;
  } catch (err) {
    // 3) 혹시 만료 경합으로 401이면 한 번만 재시도
    if (err?.response?.status === 401) {
      await ensureAccessToken();
      const res2 = await http.get("/api/users/me", { withCredentials: true });
      return res2.data;
    }
    throw err;
  }
}


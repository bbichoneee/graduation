// src/api/user.js
import { http, ensureAccessToken, tokenStore } from "./http";

/**
 * 현재 사용자 조회 (/api/users/me)
 * - AT가 없으면 refresh 1회 시도
 * - AT를 명시적으로 Authorization 헤더에 붙여 호출
 */
export async function fetchCurrentUser() {
  // 1) AT 확보 시도
  const at = await ensureAccessToken();

  // 2) AT가 끝내 없으면 로그인 필요 상태로 처리
  if (!at) {
    // 필요하면 null 반환으로 바꿔도 됩니다.
    throw new Error("로그인이 필요합니다. (accessToken 없음)");
  }

  // 3) 명시적으로 Bearer 붙여 호출
  const res = await http.get("/api/users/me", {
    withCredentials: true,
    headers: { Authorization: `Bearer ${at}` },
  });
  return res.data;
}

/**
 * 특정 사용자 정보 조회 (/api/users/{userId})
 */
export async function fetchUserById(userId) {
  const at = await ensureAccessToken();
  if (!at) {
    throw new Error("로그인이 필요합니다. (accessToken 없음)");
  }
  const res = await http.get(`/api/users/${userId}`, {
    headers: { Authorization: `Bearer ${at}` },
  });
  return res.data;
}

/**
 * 특정 사용자의 취약 문제 유형 조회 (/api/users/{userId}/weakest-type)
 */
export async function fetchWeakestProblemType(userId) {
  const at = await ensureAccessToken();
  if (!at) {
    throw new Error("로그인이 필요합니다. (accessToken 없음)");
  }
  const res = await http.get(`/api/users/${userId}/weakest-type`, {
    headers: { Authorization: `Bearer ${at}` },
  });
  return res.data;
}

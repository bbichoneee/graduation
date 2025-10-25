// src/api/auth.js
import { http, tokenStore } from "./http";
import { mockSignup, mockLogin, mockMe } from "../mocks/mockAuth";

const { USE_MOCK, setTokens, getAccess } = tokenStore;

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

/**
 * 로그인
 * - accessToken: 응답 바디에서 읽음
 * - refreshToken: 응답 헤더(X-Refresh-Token) 우선, 없으면 바디에서 시도
 * - 토큰 저장 후 저장 성공 여부(ok)까지 반환
 */
export async function login(payload) {
  if (USE_MOCK) {
    const data = await mockLogin(payload);
    setTokens(data.accessToken, data.refreshToken);
    const ok = !!(localStorage.getItem("accessToken") || "");
    return { ok, accessToken: localStorage.getItem("accessToken") || "", raw: data };
  }

  try {
    const res = await http.post("/api/auth/login", payload);
    const data = res.data || {};
    const accessToken = data.accessToken;

    // 리프레시 토큰: 헤더 우선
    const headerRt =
      res.headers?.["x-refresh-token"] ??
      res.headers?.["X-Refresh-Token"] ??
      null;

    setTokens(accessToken, headerRt ?? data.refreshToken ?? null);

    // 저장 검증
    const savedAT = localStorage.getItem("accessToken") || "";
    const ok = !!savedAT;

    return { ok, accessToken: savedAT, raw: data };
  } catch (err) {
    const status = err?.response?.status ?? "";
    const msg = err?.response?.data
      ? typeof err.response.data === "string"
        ? err.response.data
        : JSON.stringify(err.response.data)
      : "";
    throw new Error(`로그인 실패 ${status}${msg ? `: ${msg}` : ""}`);
  }
}

/** 내 정보 조회 */
export async function fetchMe() {
  if (USE_MOCK) return mockMe(getAccess());
  const res = await http.get("/api/auth/me");
  return res.data;
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
  let profileImageUrl = t(p.profileImageUrl);

  // dataURL 금지 → 기본 이미지로
  if (profileImageUrl && profileImageUrl.startsWith("data:")) {
    profileImageUrl = "/img/default_profile.png";
  }
  // 닉네임 보정
  if (!nickname || nickname === "사용자" || nickname.length < 2) {
    nickname = `사용자_${Math.random().toString(36).slice(2, 6)}`;
  }
  return { username, password, nickname, profileImageUrl };
}

// src/api/auth.js
import { http, tokenStore } from "./http";
import { mockSignup, mockLogin, mockRefresh, mockMe } from "../mocks/mockAuth";
const { USE_MOCK, setTokens, getAccess } = tokenStore;

export async function signUp(payload) {
  if (USE_MOCK) return mockSignup(payload);
  const sanitized = sanitizeSignupPayload(payload);
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(sanitized),
  });
  if (!res.ok) {
    let msg = ""; try { msg = await res.text(); } catch {}
    throw new Error(`회원가입 실패 ${res.status}${msg ? `: ${msg}` : ""}`);
  }
  try { return await res.json(); } catch { return {}; }
}

export async function login(payload) {
  if (USE_MOCK) {
    const data = await mockLogin(payload);
    setTokens(data.accessToken, data.refreshToken);
    return data;
  }
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = ""; try { msg = await res.text(); } catch {}
    throw new Error(`로그인 실패 ${res.status}${msg ? `: ${msg}` : ""}`);
  }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken ?? null);
  return data;
}

export async function fetchMe() {
  if (USE_MOCK) return mockMe(getAccess());
  const res = await http("/api/auth/me");
  if (!res.ok) throw new Error("내 정보 조회 실패");
  return res.json();
}
export function logoutLocal() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

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
  // 닉네임 유니크 회피(임시 접미사)
  if (!nickname || nickname === "사용자" || nickname.length < 2) {
    nickname = `사용자_${Math.random().toString(36).slice(2, 6)}`;
  }
  return { username, password, nickname, profileImageUrl };
}

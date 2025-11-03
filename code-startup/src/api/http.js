// src/api/http.js
import axios from "axios";

/** ====== 환경 변수 ====== */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 내부에서 동시 refresh를 하나로 합치기 위한 공유 프라미스
let refreshPromise = null;

/** ====== 토큰 저장소 ====== */
function getAccess() {
  return localStorage.getItem("accessToken") || "";
}
function getRefresh() {
  return localStorage.getItem("refreshToken") || "";
}
function setTokens(access, refresh) {
  if (access) localStorage.setItem("accessToken", access);
  if (refresh !== undefined && refresh !== null) {
    if (refresh) localStorage.setItem("refreshToken", refresh);
    else localStorage.removeItem("refreshToken");
  }
}

/** 외부에서 필요할 수 있어 export */
export const tokenStore = { getAccess, getRefresh, setTokens, USE_MOCK };

/** ====== Axios 인스턴스 ====== */
export const http = axios.create({
  baseURL: USE_MOCK ? "" : (import.meta.env.VITE_API_BASE_URL || ""), // mock=1이면 동일오리진
  withCredentials: true,
});

/** ====== 리프레시 시도 함수 (localStorage 기반) ====== */
async function tryRefreshReal() {
  const refreshToken = getRefresh();
  if (!refreshToken) {
    console.warn("[REFRESH] No refreshToken in localStorage");
    return false;
  }

  try {
    const res = await axios.post(
      `${API_BASE}/api/auth/refresh`,
      { refreshToken }, // body에 RT를 실어 전송
      {
        withCredentials: true, // 혹시 모르니 유지
        validateStatus: (s) => s >= 200 && s < 500,
      }
    );

    if (res.status !== 200) {
      console.warn("[REFRESH] status", res.status, res.data);
      return false;
    }

    const data = res.data || {};
    // 바디/헤더 어디로 오든 최대한 흡수
    const bodyAT = data.accessToken || data.access_token || data.token || data.id_token || null;

    const hdr = res.headers || {};
    const hdrRT = hdr["x-refresh-token"] || hdr["X-Refresh-Token"] || null;

    let hdrAT = hdr["x-access-token"] || hdr["X-Access-Token"] || null;
    const authHeader = hdr["authorization"] || hdr["Authorization"] || null;
    if (!hdrAT && authHeader && /^Bearer\s+/i.test(authHeader)) {
      hdrAT = authHeader.replace(/^Bearer\s+/i, "").trim();
    }

    const nextAccess = bodyAT || hdrAT || null;
    const nextRefresh = hdrRT ?? undefined; // undefined면 기존 RT 유지

    if (nextAccess) {
      setTokens(nextAccess, nextRefresh);
      console.log("[REFRESH] issued AT:", (nextAccess || "").slice(0, 24) + "...");
      return true;
    }

    // 바디/헤더에 AT가 없고 쿠키만 갱신된 케이스
    if (hdrRT) setTokens(getAccess(), hdrRT);
    console.log("[REFRESH] cookie-only 200 (no AT in body/header)");
    return true;
  } catch (e) {
    console.warn("[REFRESH] FAIL", e?.response?.status, e?.response?.data);
    return false;
  }
}

/**
 * 보호 API를 호출하기 전에 Access Token을 보장
 * - 로컬에 AT가 있으면 그대로 반환
 * - 없으면 refresh 1회 시도 → 성공 시 새 AT 반환, 실패 시 null
 */
export async function ensureAccessToken() {
  const at = getAccess && getAccess();
  if (at) return at;

  try {
    const ok = await tryRefreshReal();
    if (!ok) return null;
    const next = getAccess && getAccess();
    return next || null;
  } catch {
    return null;
  }
}

/** ====== 공용 유틸: path 추출 ====== */
function toPath(urlLike) {
  try {
    return new URL(String(urlLike || ""), API_BASE).pathname;
  } catch {
    return String(urlLike || "");
  }
}

/** ====== 요청 인터셉터 ====== */
http.interceptors.request.use((config) => {
  if (USE_MOCK) return config;

  const path = toPath(config.url);
  const method = (config.method || "GET").toUpperCase();

  // 🔐 인증 스킵 규칙
  const isAuthPath =
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/signup") ||
    path.startsWith("/api/auth/refresh");

  const isPublicPath = /^\/api\/(problems(?:\/.*)?)\b/i.test(path);

  // OPTIONS는 항상 스킵
  const isOptions = method === "OPTIONS";

  // 헤더 준비
  config.headers = config.headers || {};

  // '/api/.../me' 형태의 경로는 보호 API로 간주
  const isMePath = path.endsWith("/me");

  if (!isMePath && (isOptions || isAuthPath || isPublicPath)) {
    // 이 요청에는 Authorization 헤더 제거 (잘못된 AT가 붙어 401 나는 경우 방지)
    if (config.headers.Authorization) delete config.headers.Authorization;
    return config;
  }

  // 그 외 보호 API에는 AT 자동 부착 (예: /api/users/me, /api/ranking 등)
  const at = getAccess();
  if (at) {
    config.headers.Authorization = `Bearer ${at}`;
  }

  return config;
});

/** ====== 응답 인터셉터 ====== */
http.interceptors.response.use(
  // ✅ 성공 응답: 혹시 바디/헤더로 새 토큰이 오면 반영
  (res) => {
    try {
      const data = res?.data || {};
      const maybeAccess = data.accessToken || data.access_token || null;
      const headerRefresh =
        res.headers?.["x-refresh-token"] ??
        res.headers?.["X-Refresh-Token"] ??
        null;

      if (maybeAccess || headerRefresh) {
        setTokens(maybeAccess || getAccess(), headerRefresh ?? undefined);
      }
    } catch {/* no-op */}
    return res;
  },

  // ❌ 에러 응답: 401 처리(Refresh → 재시도 → 쿠키-only 폴백)
  async (error) => {
    const { config, response } = error || {};
    if (!response) throw error;

    const path = toPath(config?.url || "");
    const status = response.status;

    // refresh 자체는 재시도 금지
    if (path.startsWith("/api/auth/refresh")) throw error;

    // 공개 경로는 원칙적으로 토큰이 필요 없음: 여기서 refresh 루프 방지
    const isPublicPath = /^\/api\/(problems(?:\/.*)?|submissions(?:\/.*)?|submission(?:\/.*)?)\b/i.test(path);
    if (isPublicPath && status === 401) {
      // 혹시 이전 요청이 Authorization을 잘못 달고 간 경우 → 무토큰 1회 재시도
      if (!config._retryNoAuthOnce) {
        const cfg2 = { ...config, _retryNoAuthOnce: true, withCredentials: true };
        if (cfg2.headers) delete cfg2.headers.Authorization;
        console.log("[RETRY-NOAUTH]", "→", path);
        return http(cfg2);
      }
      // 여전히 401이면 서버 권한 정책이므로 그대로 throw
      throw error;
    }

    // 401만 특별 처리
    if (status !== 401) throw error;

    // 이미 refresh+재시도, 쿠키전용까지 했으면 종료
    if (config._retry && config._retryCookieOnce) throw error;

    // 최초 401 → refresh 시도
    if (!config._retry) {
      config._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try { return await tryRefreshReal(); }
          finally { refreshPromise = null; }
        })();
      }
      const refreshed = await refreshPromise;

      if (refreshed) {
        // 새 AT 있으면 Authorization, 없으면 쿠키만으로
        const newAT = getAccess();
        config.headers = config.headers || {};
        if (newAT) config.headers.Authorization = `Bearer ${newAT}`;
        else delete config.headers.Authorization;

        config.withCredentials = true;
        console.log("[RETRY]", newAT ? "with AT" : "cookie-only", "→", path);

        try {
          return await http(config);
        } catch (e2) {
          // 여전히 401이고 AT가 붙은 상태였다면 → 쿠키 전용 마지막 1회
          if (e2?.response?.status === 401 && newAT && !config._retryCookieOnce) {
            const cfg2 = { ...config, _retryCookieOnce: true };
            if (cfg2.headers) delete cfg2.headers.Authorization;
            cfg2.withCredentials = true;
            console.log("[RETRY-COOKIE]", "→", path);
            return http(cfg2);
          }
          throw e2;
        }
      }

      // refresh 실패 → 토큰 정리 후 그대로 에러
      try { setTokens(null, null); } catch {}
      throw error;
    }

    // 이미 refresh는 했는데 또 401이 왔다면 → "쿠키 전용" 마지막 1회
    if (!config._retryCookieOnce) {
      const cfg2 = { ...config, _retryCookieOnce: true };
      if (cfg2.headers) delete cfg2.headers.Authorization;
      cfg2.withCredentials = true;
      console.log("[RETRY-COOKIE2]", "→", path);
      return http(cfg2);
    }

    throw error;
  }
);

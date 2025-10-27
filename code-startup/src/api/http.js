import axios from "axios";

/** ====== 환경 변수 ====== */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
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
export const tokenStore = { getAccess, getRefresh, setTokens, USE_MOCK };

/** ====== Axios 인스턴스 ====== */
export const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ★ 쿠키 주고받기
  // timeout: 15000,     // (선택) 타임아웃
});

/** ====== 리프레시 시도 함수 (Axios 전용) ====== */
async function tryRefreshReal() {
  try {
    const res = await axios.post(
      `${API_BASE}/api/auth/refresh`,
      null,
      {
        withCredentials: true,                         // 쿠키만으로 인증
        validateStatus: (s) => s >= 200 && s < 500,    // 4xx를 throw 하지 않도록
      }
    );

    if (res.status !== 200) {
      console.warn("[REFRESH] status", res.status, res.data);
      return false;
    }

    const data = res.data || {};
    // 바디/헤더 다양한 키 지원
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
      console.log(
        "[REFRESH] AT from",
        bodyAT ? "body" : "header",
        (nextAccess || "").slice(0, 24) + "..."
      );
      return true;
    }

    // 바디/헤더에 AT가 없어도, 쿠키 갱신만 했을 수 있음
    console.log("[REFRESH] cookie-only 200 (no AT in body/header)");
    if (hdrRT) setTokens(getAccess(), hdrRT);
    return true;
  } catch (e) {
    console.warn("[REFRESH] FAIL", e?.response?.status, e?.response?.data);
    return false;
  }
}

/**
 * 로그인 직후나 보호 API 호출 직전에 Access Token을 보장합니다.
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

/** ====== 요청 인터셉터 ====== */
http.interceptors.request.use((config) => {
  if (USE_MOCK) return config;

  // url → path 추출
  let path = "";
  try {
    const urlStr = String(config.url || "");
    path = new URL(urlStr, API_BASE).pathname; // /api/...
  } catch {
    path = String(config.url || "");
  }

  // 🔐 인증 스킵 규칙
  const isAuthPath =
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/signup") ||
    path.startsWith("/api/auth/refresh");

  // ✅ 공개(permitAll) 경로: 백엔드에서 열어둔 API —> 토큰 붙이지 않음
  const isPublicPath = /^\/api\/(problems|submissions)\b/.test(path);

  // OPTIONS는 항상 스킵
  const isOptions = (config.method || "GET").toUpperCase() === "OPTIONS";

  // 헤더 준비
  config.headers = config.headers || {};

  if (isOptions || isAuthPath || isPublicPath) {
    // 이 요청에는 Authorization 헤더 제거
    if (config.headers.Authorization) delete config.headers.Authorization;
    return config;
  }

  // 그 외 보호 API에는 토큰 자동 부착
  const at = getAccess();
  if (at) {
    config.headers.Authorization = `Bearer ${at}`;
  }

  // 디버그(선택): 어떤 요청에 AT가 붙었는지 확인
  // console.log("[HTTP] →", (config.method || "GET").toUpperCase(), path, config.headers.Authorization ? "Bearer..." : "no-auth");

  return config;
});

/** ====== 응답 인터셉터: 성공 시 토큰 갱신, 401 시 refresh → 재시도(+쿠키전용 폴백) ====== */
http.interceptors.response.use(
  // ✅ 성공 응답
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
    } catch {}
    return res;
  },

  // ❌ 에러 응답
  async (error) => {
    const { config, response } = error || {};
    if (!response) throw error;

    const urlStr = String(config?.url || "");
    let path = "";
    try { path = new URL(urlStr, API_BASE).pathname; } catch { path = urlStr; }

    // refresh 자체는 재시도 금지
    if (urlStr.includes("/api/auth/refresh")) throw error;

    // 공개 경로는 원칙적으로 토큰이 필요 없음: 여기서 refresh 루프를 타지 않도록 방지
    const isPublicPath = /^\/api\/(problems|submissions)\b/.test(path);
    if (isPublicPath && response.status === 401) {
      // 혹시 이전 요청이 토큰을 잘못 붙여갔던 경우: 무토큰으로 1회 재시도
      if (!config._retryNoAuthOnce) {
        const cfg2 = { ...config, _retryNoAuthOnce: true, withCredentials: true };
        if (cfg2.headers) delete cfg2.headers.Authorization;
        console.log("[RETRY-NOAUTH]", "→", path);
        return http(cfg2);
      }
      // 그래도 401이면 그대로 던짐(서버 정책 상 다른 이유일 수 있음)
      throw error;
    }

    // 401만 특별 처리
    if (response.status !== 401) throw error;

    // 이미 refresh+재시도 했고, 쿠키전용까지 시도했으면 종료
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



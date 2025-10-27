// code-startup/src/api/http.js
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
// src/api/http.js  안의 tryRefreshReal 교체
async function tryRefreshReal() {
  try {
    const res = await axios.post(
      `${API_BASE}/api/auth/refresh`,
      null,                                // ⚠️ body 비움
      { withCredentials: true }            // ⚠️ 쿠키만 전송
    );

    const data = res.data || {};
    const headerRefresh =
      res.headers?.['x-refresh-token'] ??
      res.headers?.['X-Refresh-Token'] ?? null;

    const nextAccess  = data.accessToken || data.access_token || null;
    const nextRefresh = headerRefresh ?? undefined;

    if (!nextAccess) return false;

    setTokens(nextAccess, nextRefresh);
    console.log('[REFRESH] cookie-only OK  newAT=', (nextAccess||'').slice(0,24)+'...', ' newRT=', headerRefresh ? '(header)' : '(cookie)');
    return true;
  } catch (e) {
    console.warn('[REFRESH] FAIL', e?.response?.status, e?.response?.data);
    return false;
  }
}

/** 
 * 로그인 직후나 보호 API 호출 직전에 Access Token을 보장합니다.
 * - 로컬에 AT가 있으면 그대로 반환
 * - 없으면 refresh 1회 시도 → 성공 시 새 AT 반환, 실패 시 null
 */
export async function ensureAccessToken() {
  const at = getAccess && getAccess();   // 로컬 AT 확인
  if (at) return at;

  try {
    const ok = await tryRefreshReal();   // ← http.js 안에 이미 있는 함수 사용
    if (!ok) return null;
    const next = getAccess && getAccess();
    return next || null;
  } catch {
    return null;
  }
}


http.interceptors.request.use((config) => {
  if (USE_MOCK) return config;

  const urlStr = String(config.url || '');
  let path = urlStr;
  try { path = new URL(urlStr, API_BASE).pathname; } catch {}

  const skipAuth =
    config.method?.toUpperCase() === 'OPTIONS' ||
    path.includes('/api/auth/login') ||
    path.includes('/api/auth/signup') ||
    path.includes('/api/auth/refresh');

  if (!skipAuth) {
    const at = getAccess();
    if (at) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${at}`;
    }
  }
  console.log('[HTTP] →', (config.method||'GET').toUpperCase(), path, config.headers?.Authorization);
  return config;
});



/** ====== 응답 인터셉터: 성공 시 토큰 갱신, 401 시 1회 리프레시 후 재시도 ====== */
http.interceptors.response.use(
  // ✅ 성공 응답
  (res) => {
    try {
      const data = res?.data || {};
      // 바디에 새 accessToken 이 올 수 있음
      const maybeAccess = data.accessToken || data.access_token || null;
      // 헤더에 새 refresh 토큰이 올 수 있음
      const headerRefresh =
        res.headers?.['x-refresh-token'] ??
        res.headers?.['X-Refresh-Token'] ??
        null;

      if (maybeAccess || headerRefresh) {
        // access 는 바디, refresh 는 헤더(또는 유지)
        setTokens(maybeAccess || getAccess(), headerRefresh ?? undefined);
      }
    } catch {}
    return res;
  },

  // ❌ 에러 응답
  async (error) => {
    const { config, response } = error;
    console.warn('[HTTP:401]', config.method?.toUpperCase(), config.url, 'res.data=', response.data);
    if (!response) throw error; // 네트워크 오류 등 그대로

    const url = (config?.url || '').toString();

    // 리프레시 요청 자체는 재시도 금지 (무한루프 방지)
    if (url.includes('/api/auth/refresh')) {
      throw error;
    }

    // 401 이 아니거나 이미 재시도했다면 그대로 던짐
    if (response.status !== 401 || config._retry) {
      throw error;
    }

    // 여기서부터 401 최초 1회만 리프레시 시도
    config._retry = true;

    // 동시에 여러 401이 떠도 리프레시는 '한 번'만 수행
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const ok = await tryRefreshReal(); // 바디 accessToken, 헤더 X-Refresh-Token 처리
          return ok;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const refreshed = await refreshPromise;

    if (refreshed) {
      // 갱신된 access 로 Authorization 교체 후 원요청 재시도
      const newAT = getAccess();
      config.headers = config.headers ?? {};
      if (newAT) config.headers.Authorization = `Bearer ${newAT}`;
      console.log('[RETRY] attach AT =', String(newAT).slice(0,24)+'...', '→', config.url);
      config.withCredentials = true;
      return http(config);
    }

     try {
      setTokens(null, null); // access/refresh 정리
    } catch {}

    // 리프레시 실패 → 원 에러 그대로
    throw error;
  }
);




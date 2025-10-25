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
async function tryRefreshReal() {
  const rt = getRefresh();
  if (!rt) return false;

  // 인터셉터에 의한 무한루프를 막기 위해, 인스턴스가 아닌 'axios' 기본 클라이언트로 호출
  try {
    const res = await axios.post(
      `${API_BASE}/api/auth/refresh`,
      { refreshToken: rt }, // 서버가 바디도 받도록 구현되어 있음
      { withCredentials: true }
    );

    // 응답 바디/헤더에서 새 토큰 추출
    const data = res.data || {};
    const headerRt =
      res.headers?.["x-refresh-token"] ??
      res.headers?.["X-Refresh-Token"] ??
      null;

    // access 토큰(필수), refresh 토큰(헤더 우선, 바디 대안)
    setTokens(data.accessToken, headerRt ?? data.refreshToken ?? null);
    return true;
  } catch {
    return false;
  }
}

/** ====== 요청 인터셉터: Authorization 자동 부착 ====== */
http.interceptors.request.use((config) => {
  if (USE_MOCK) return config; // 모의 모드는 각 API 파일에서 직접 분기

  const at = getAccess();
  if (at) {
    // 기존 헤더 보존
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${at}`;
  }
   // ★ 디버그: 어떤 URL로 어떤 Authorization으로 나가는지 확인
  console.log("[HTTP] →", config.method?.toUpperCase(), config.url, config.headers?.Authorization);
  return config;
});


/** ====== 응답 인터셉터: 401이면 단 1회 리프레시 후 재시도 ====== */
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (!response) throw error; // 네트워크 오류 등

    const url = (config?.url || "").toString();

    // ❌ 리프레시 요청 자체에선 재시도/리프레시 로직 금지 (무한루프 방지)
    if (url.includes("/api/auth/refresh")) {
      throw error;
    }

    // ✅ 401이고, 아직 재시도 안 했으면
    if (response.status === 401 && !config._retry) {
      config._retry = true;

      // ✅ 동시에 여러 401이 떠도 리프레시는 '단 한 번'만 수행
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const ok = await tryRefreshReal(); // 기존 함수 사용
            return ok;
          } finally {
            // 완료되면 잠금 해제
            refreshPromise = null;
          }
        })();
      }
      const refreshed = await refreshPromise;

      if (refreshed) {
        // 새 액세스 토큰으로 Authorization 교체
        const newAT = getAccess(); // http.js 안의 함수
        config.headers = config.headers ?? {};
        if (newAT) config.headers.Authorization = `Bearer ${newAT}`;

        // 원 요청 재시도 (쿠키 포함)
        config.withCredentials = true;
        return http(config);
      }
    }

    // 위 조건에 해당 안 되면 원래 에러 그대로
    throw error;
  }
);


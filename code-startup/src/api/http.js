const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function getAccess() { return localStorage.getItem("accessToken") || ""; }
function getRefresh() { return localStorage.getItem("refreshToken") || ""; }
function setTokens(access, refresh) {
  if (access) localStorage.setItem("accessToken", access);
  if (refresh !== undefined && refresh !== null) {
    if (refresh) localStorage.setItem("refreshToken", refresh);
    else localStorage.removeItem("refreshToken");
  }
}

async function tryRefreshReal() {
  const rt = getRefresh();
  if (!rt) return false;
  const res = await fetch(API_BASE + "/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await res.json();
  const newRt = res.headers.get("X-Refresh-Token");
  setTokens(data.accessToken, newRt ?? data.refreshToken ?? null);
  return true;
}

export async function http(input, init = {}) {
  if (USE_MOCK) {
    // 모의 모드는 이 래퍼를 통하지 않고, 각 API에서 mock 호출을 직접 사용.
    // 여기선 실서버 호출만 담당.
  }
  const headers = new Headers(init.headers || {});
  const at = getAccess();
  if (at) headers.set("Authorization", `Bearer ${at}`);

  const res = await fetch(API_BASE + input, { ...init, headers, credentials: "include" });
  if (res.status !== 401) return res;

  const refreshed = await tryRefreshReal();
  if (!refreshed) return res;

  const headers2 = new Headers(init.headers || {});
  headers2.set("Authorization", `Bearer ${getAccess()}`);
  return fetch(API_BASE + input, { ...init, headers: headers2, credentials: "include" });
}

export const tokenStore = { getAccess, getRefresh, setTokens, USE_MOCK };

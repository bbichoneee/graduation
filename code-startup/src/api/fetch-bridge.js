// src/utils/fetch-bridge.js
import { http } from "../api/http";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const origFetch = window.fetch.bind(window);

/** URL이 API 대상으로 판단되면 true */
function isApi(urlStr) {
  try {
    const u = new URL(urlStr, window.location.origin);
    const base = new URL(API_BASE);
    // 상대경로 /api/... 인가, 혹은 API_BASE로 향하는가
    if (u.pathname.startsWith("/api/")) return true;
    if (u.origin === base.origin && u.pathname.startsWith("/api/")) return true;
    return false;
  } catch {
    return false;
  }
}

/** axios에 넘길 path('/api/..' + search) */
function toPath(urlStr) {
  const u = new URL(urlStr, window.location.origin);
  return `${u.pathname}${u.search || ""}`;
}

/** Headers/PlainObject/Array를 axios가 이해하는 plain object로 변환 */
function headersToObject(hdrs) {
  if (!hdrs) return {};
  if (typeof Headers !== "undefined" && hdrs instanceof Headers) {
    const o = {};
    hdrs.forEach((v, k) => (o[k] = v));
    return o;
  }
  if (Array.isArray(hdrs)) {
    const o = {};
    for (const [k, v] of hdrs) o[k] = v;
    return o;
  }
  return { ...hdrs };
}

/** axios 응답을 fetch Response로 변환 */
async function axiosToResponse(promise, dbg) {
  try {
    const r = await promise;
    const body =
      typeof r.data === "string"
        ? r.data
        : r.data != null
        ? JSON.stringify(r.data)
        : "";
    const headers = new Headers();
    for (const [k, v] of Object.entries(r.headers || {})) {
      if (v != null) headers.append(k, Array.isArray(v) ? v.join(", ") : String(v));
    }
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    if (dbg) console.log(`[FETCH→AXIOS OK] ${dbg} ${r.status}`);
    return new Response(body, { status: r.status, headers });
  } catch (e) {
    if (e.response) {
      const r = e.response;
      const body =
        typeof r.data === "string"
          ? r.data
          : r.data != null
          ? JSON.stringify(r.data)
          : "";
      const headers = new Headers();
      for (const [k, v] of Object.entries(r.headers || {})) {
        if (v != null) headers.append(k, Array.isArray(v) ? v.join(", ") : String(v));
      }
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
      if (dbg) console.warn(`[FETCH→AXIOS ERR] ${dbg} ${r.status}`, r.data);
      return new Response(body, { status: r.status, headers });
    }
    console.warn(`[FETCH→AXIOS ERR] ${dbg} network/cancel`, e?.message);
    throw e;
  }
}

/** body 문자열을 Content-Type 보고 파싱(axios에 object로 넘길 수 있게) */
function maybeParseBodyString(bodyStr, contentType = "") {
  if (!bodyStr || typeof bodyStr !== "string") return bodyStr;
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(bodyStr);
    } catch {
      return bodyStr;
    }
  }
  return bodyStr;
}

/** fetch를 프록시하여 API 호출은 axios(http)로 위임 */
window.fetch = new Proxy(origFetch, {
  async apply(_t, _this, args) {
    const [input, initArg] = args;
    const init = initArg || {};

    const reqObj =
      typeof Request !== "undefined" && input instanceof Request ? input : null;
    const url = typeof input === "string" ? input : reqObj ? reqObj.url : String(input);

    const methodBase =
      (init.method || (reqObj ? reqObj.method : "GET") || "GET").toUpperCase();

    // API 아님 또는 OPTIONS 프리플라이트는 원 fetch
    if (methodBase === "OPTIONS" || !isApi(url)) {
      return origFetch(...args);
    }

    const method = methodBase;
    const path = toPath(url);

    // Headers 병합
    const mergedHeaders = new Headers();
    if (reqObj?.headers) reqObj.headers.forEach((v, k) => mergedHeaders.set(k, v));
    const initHdrObj = headersToObject(init.headers);
    for (const [k, v] of Object.entries(initHdrObj)) mergedHeaders.set(k, v);

    // credentials: refresh 쿠키 필요 → include 고정
    const signal = init.signal || (reqObj ? reqObj.signal : undefined);

    // Body
    let bodyProvided = init.body !== undefined ? init.body : undefined;
    if (bodyProvided === undefined && reqObj && reqObj.bodyUsed === false) {
      try {
        const text = await reqObj.clone().text();
        bodyProvided = text.length ? text : undefined;
      } catch {}
    }

    const contentType =
      mergedHeaders.get("content-type") ||
      mergedHeaders.get("Content-Type") ||
      "";

    let data = bodyProvided;
    if (typeof data === "string") {
      data = maybeParseBodyString(data, contentType);
    }

    if (typeof FormData !== "undefined" && data instanceof FormData) {
      mergedHeaders.delete("content-type");
      mergedHeaders.delete("Content-Type");
    }

    const axCfg = {
      headers: headersToObject(mergedHeaders),
      withCredentials: true,
      signal,
    };

    const dbg = `${method} ${path}`;

    switch (method) {
      case "GET":
        return axiosToResponse(http.get(path, axCfg), dbg);
      case "POST":
        return axiosToResponse(http.post(path, data, axCfg), dbg);
      case "PUT":
        return axiosToResponse(http.put(path, data, axCfg), dbg);
      case "PATCH":
        return axiosToResponse(http.patch(path, data, axCfg), dbg);
      case "DELETE":
        return axiosToResponse(http.delete(path, { ...axCfg, data }), dbg);
      default:
        return axiosToResponse(
          http.request({ url: path, method, data, ...axCfg }),
          dbg
        );
    }
  },
});

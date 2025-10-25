import { http } from "./http";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const origFetch = window.fetch.bind(window);

function isApi(urlStr) {
  const u = new URL(urlStr, window.location.origin);
  if (u.pathname.startsWith("/api/")) return true;
  const base = new URL(API_BASE);
  return u.origin === base.origin && u.pathname.startsWith("/api/");
}
function toPath(urlStr) {
  const u = new URL(urlStr, window.location.origin);
  return u.pathname + u.search;
}
async function axiosToResponse(promise) {
  try {
    const r = await promise;
    const body = typeof r.data === "string" ? r.data : r.data != null ? JSON.stringify(r.data) : "";
    const headers = new Headers();
    for (const [k, v] of Object.entries(r.headers || {})) {
      if (v != null) headers.append(k, Array.isArray(v) ? v.join(", ") : String(v));
    }
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    return new Response(body, { status: r.status, headers });
  } catch (e) {
    if (e.response) {
      const r = e.response;
      const body = typeof r.data === "string" ? r.data : r.data != null ? JSON.stringify(r.data) : "";
      const headers = new Headers();
      for (const [k, v] of Object.entries(r.headers || {})) {
        if (v != null) headers.append(k, Array.isArray(v) ? v.join(", ") : String(v));
      }
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
      return new Response(body, { status: r.status, headers });
    }
    throw e;
  }
}

window.fetch = new Proxy(origFetch, {
  apply(_t, _this, args) {
    const [input, init] = args;
    const url = typeof input === "string" ? input : input.url;
    if (!isApi(url)) return origFetch(...args);

    const method = (init?.method || (typeof input !== "string" ? input.method : "GET")).toUpperCase();
    let data;
    if (init?.body != null) {
      if (typeof init.body === "string") { try { data = JSON.parse(init.body); } catch { data = init.body; } }
      else { data = init.body; }
    }
    const path = toPath(url);

    switch (method) {
      case "GET":    return axiosToResponse(http.get(path));
      case "POST":   return axiosToResponse(http.post(path, data));
      case "PUT":    return axiosToResponse(http.put(path, data));
      case "PATCH":  return axiosToResponse(http.patch(path, data));
      case "DELETE": return axiosToResponse(http.delete(path, { data }));
      default:       return axiosToResponse(http.request({ url: path, method, data }));
    }
  },
});

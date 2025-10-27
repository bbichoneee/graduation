// src/utils/fetch-bridge.js
import { http } from '../api/http';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const origFetch = window.fetch.bind(window);

// '/api/...' 또는 API_BASE로 시작하는 절대 URL인지 판단
function isApi(urlStr) {
  const u = new URL(urlStr, window.location.origin);
  if (u.pathname.startsWith('/api/')) return true;
  const base = new URL(API_BASE);
  return u.origin === base.origin && u.pathname.startsWith('/api/');
}

// axios에 넘길 path('/api/...')로 변환
function toPath(urlStr) {
  const u = new URL(urlStr, window.location.origin);
  return u.pathname + u.search;
}

// axios 응답 → fetch Response 로 변환
async function axiosToResponse(promise) {
  try {
    const r = await promise;
    const body =
      typeof r.data === 'string'
        ? r.data
        : r.data != null
        ? JSON.stringify(r.data)
        : '';
    const headers = new Headers();
    // axios headers 전달
    for (const [k, v] of Object.entries(r.headers || {})) {
      if (v != null) headers.append(k, Array.isArray(v) ? v.join(', ') : String(v));
    }
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    return new Response(body, { status: r.status, headers });
  } catch (e) {
    if (e.response) {
      const r = e.response;
      const body =
        typeof r.data === 'string'
          ? r.data
          : r.data != null
          ? JSON.stringify(r.data)
          : '';
      const headers = new Headers();
      for (const [k, v] of Object.entries(r.headers || {})) {
        if (v != null) headers.append(k, Array.isArray(v) ? v.join(', ') : String(v));
      }
      if (!headers.has('content-type')) headers.set('content-type', 'application/json');
      return new Response(body, { status: r.status, headers });
    }
    throw e;
  }
}

window.fetch = new Proxy(origFetch, {
  apply(_t, _this, args) {
    const [input, init = {}] = args;
    const url = typeof input === 'string' ? input : input.url;

    // API 이외는 원래 fetch 사용
    if (!isApi(url)) return origFetch(...args);

    const method =
      (init.method || (typeof input !== 'string' ? input.method : 'GET') || 'GET').toUpperCase();

    // body 추출 (JSON 문자열이면 파싱, FormData/Blob은 그대로)
    let data;
    if (init.body != null) {
      if (typeof init.body === 'string') {
        try {
          data = JSON.parse(init.body);
        } catch {
          data = init.body; // raw string
        }
      } else {
        data = init.body; // FormData/Blob/ArrayBuffer 등
      }
    }

    // 원래 fetch의 headers/signal/쿠키 전달 보장
    const axCfg = {
      headers: init.headers,           // http 인스턴스가 Authorization 추가 (인터셉터)
      withCredentials: true,           // refresh 쿠키 포함
      signal: init.signal,             // AbortSignal 전달
      // timeout은 axios 인스턴스에 위임
    };

    const path = toPath(url);

    switch (method) {
      case 'GET':
        return axiosToResponse(http.get(path, axCfg));
      case 'POST':
        return axiosToResponse(http.post(path, data, axCfg));
      case 'PUT':
        return axiosToResponse(http.put(path, data, axCfg));
      case 'PATCH':
        return axiosToResponse(http.patch(path, data, axCfg));
      case 'DELETE':
        // axios delete 의 data 전달은 config.data 로
        return axiosToResponse(http.delete(path, { ...axCfg, data }));
      default:
        return axiosToResponse(http.request({ url: path, method, data, ...axCfg }));
    }
  },
});


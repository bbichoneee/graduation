import { useEffect, useMemo, useRef, useState } from "react";
import { authHeaders } from "../../utils/authToken";

const DEFAULT_AVATAR = "/img/default_profile.jpg";

const isAbs = (u) => /^https?:\/\//i.test(u);
const isLocalStatic = (u) => typeof u === "string" && u.startsWith("/img/");
const isDataOrBlob = (u) => typeof u === "string" && (u.startsWith("data:") || u.startsWith("blob:"));
const isDicebear = (u) => typeof u === "string" && u.includes("api.dicebear.com");

function withBase(url) {
  if (!url || isAbs(url) || isLocalStatic(url) || isDataOrBlob(url)) return url || "";
  const base =
    import.meta.env.VITE_FILE_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";
  if (!base) return url.startsWith("/") ? url : `/${url}`;
  const sep = base.endsWith("/") ? "" : "/";
  const path = url.startsWith("/") ? url.slice(1) : url;
  return `${base}${sep}${path}`;
}

/**
 * candidates: string[] (우선순위)
 *  - /img/... 는 바로 src로 사용
 *  - 나머지는 fetch(+토큰, +credentials)→blob→ObjectURL
 *  - 실패 시 다음 후보 → dicebear → default
 */
export default function SecureAvatar({
  candidates = [],
  size = 44,
  className = "",
  alt = "avatar",
  circle = true,
  debug = false,
}) {
  const [src, setSrc] = useState(DEFAULT_AVATAR);
  const revokeRef = useRef(null);

  const list = useMemo(() => {
    const uniq = new Set();
    candidates.filter(Boolean).forEach((c) => uniq.add(c));
    // 안전한 폴백들
    uniq.add(DEFAULT_AVATAR);
    return Array.from(uniq);
  }, [candidates.join("|")]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 후보 순서대로 시도
      for (const raw of list) {
        try {
          // 1) 정적 로컬 /img/* → 바로 사용 (중요: 백엔드로 프록시하지 않음)
          if (isLocalStatic(raw)) {
            if (debug) console.log("[Avatar] use local static:", raw);
            if (!cancelled) setSrc(raw);
            return;
          }

          // 2) dicebear/절대 URL(data:,blob:,http...) → 그냥 사용 (fetch 불필요)
          if (isAbs(raw) || isDataOrBlob(raw) || isDicebear(raw)) {
            if (debug) console.log("[Avatar] use direct:", raw);
            if (!cancelled) setSrc(raw);
            return;
          }

          // 3) 백엔드 상대 경로 → 베이스 붙이기
          const url = withBase(raw);

          // 3-1) 토큰 + credentials로 fetch
          if (debug) console.log("[Avatar] fetch try:", url);
          let resp = await fetch(url, {
            method: "GET",
            headers: { ...authHeaders() },
            credentials: "include", // 쿠키 인증도 시도
          });

          // 3-2) 헤더 인증이 거부되는 서버일 수도 → 헤더 없이 credentials만으로 재시도
          if (!resp.ok) {
            if (debug) console.log("[Avatar] retry without headers:", url, resp.status);
            resp = await fetch(url, { method: "GET", credentials: "include" });
          }

          if (!resp.ok) {
            if (debug) console.warn("[Avatar] fail:", url, resp.status);
            continue; // 다음 후보
          }

          const blob = await resp.blob();
          const objUrl = URL.createObjectURL(blob);
          if (revokeRef.current) URL.revokeObjectURL(revokeRef.current);
          revokeRef.current = objUrl;

          if (!cancelled) setSrc(objUrl);
          if (debug) console.log("[Avatar] success:", url);
          return;
        } catch (e) {
          if (debug) console.warn("[Avatar] error:", raw, e);
          continue;
        }
      }

      // 전부 실패 → 디폴트
      if (!cancelled) setSrc(DEFAULT_AVATAR);
    }

    load();
    return () => {
      cancelled = true;
      if (revokeRef.current) URL.revokeObjectURL(revokeRef.current);
    };
  }, [list, debug]);

  const style = {
    width: typeof size === "number" ? `${size}px` : size,
    height: typeof size === "number" ? `${size}px` : size,
    objectFit: "cover",
    borderRadius: circle ? "50%" : "12px",
    background: "#f1f3f5",
  };

  return <img src={src} alt={alt} className={className} style={style} />;
}

import { useEffect, useMemo, useRef, useState } from "react";

/** ms → "mm:ss" 또는 "hh:mm:ss" */
export function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * solveq 페이지 진입 시 자동으로 타이머 시작.
 * 제출 시 recordSubmit()을 호출해 경과시간을 저장하세요.
 */
export default function useSolveTimer(problemId) {
  const storageKey = useMemo(() => `solveq:time:${problemId}`, [problemId]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(Date.now());
  const tickRef = useRef(null);

  // 자동 시작 + 틱
  useEffect(() => {
    startRef.current = Date.now();
    tickRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 250);

    // 페이지 이탈 시에도 마지막 값 저장(선택)
    const onBeforeUnload = () => {
      const ms = Date.now() - startRef.current;
      localStorage.setItem(storageKey, JSON.stringify({ lastSeenMs: ms, at: Date.now() }));
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(tickRef.current);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [storageKey]);

  // 제출 시 호출: 경과시간 저장 후 ms 반환
  const recordSubmit = () => {
    const ms = Date.now() - startRef.current;
    localStorage.setItem(storageKey, JSON.stringify({ submittedMs: ms, at: Date.now() }));
    return ms;
  };

  return { elapsedMs, formatted: formatDuration(elapsedMs), recordSubmit };
}

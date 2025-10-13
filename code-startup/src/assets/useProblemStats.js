// src/hooks/useProblemStats.js
import { useEffect, useRef, useState } from "react";

/**
 * 서버 계약(예시):
 * GET /api/problems/:id/stats → { attempts: number, solved: number }
 * WebSocket (옵션): ws://<HOST>/ws/problems/:id
 *   서버가 { attempts, solved } 를 push
 */
export default function useProblemStats(problemId, { pollMs = 10000, wsUrl } = {}) {
  const [stats, setStats] = useState({ attempts: 0, solved: 0, loading: true, error: null });
  const timerRef = useRef(null);
  const wsRef = useRef(null);

  // REST 폴링
  useEffect(() => {
    if (!problemId) return;

    const fetchOnce = async () => {
      try {
        const res = await fetch(`/api/problems/${problemId}/stats`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json(); // { attempts, solved }
        setStats({ attempts: Number(data.attempts || 0), solved: Number(data.solved || 0), loading: false, error: null });
      } catch (e) {
        setStats(prev => ({ ...prev, loading: false, error: e }));
      }
    };

    // 즉시 1회 + 주기적 폴링
    fetchOnce();
    if (pollMs > 0) {
      timerRef.current = setInterval(fetchOnce, pollMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [problemId, pollMs]);

  // (옵션) WebSocket 실시간 구독 — 서버가 있을 때만 사용
  useEffect(() => {
    if (!problemId || !wsUrl) return;
    const url = `${wsUrl.replace(/\/$/, "")}/problems/${problemId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data); // { attempts, solved }
        if (typeof data.attempts !== "undefined" && typeof data.solved !== "undefined") {
          setStats({ attempts: Number(data.attempts || 0), solved: Number(data.solved || 0), loading: false, error: null });
        }
      } catch {}
    };
    ws.onerror = (e) => setStats(prev => ({ ...prev, error: e }));
    ws.onclose = () => { /* 필요시 재접속 로직 추가 */ };

    return () => ws.close();
  }, [problemId, wsUrl]);

  return stats;
}

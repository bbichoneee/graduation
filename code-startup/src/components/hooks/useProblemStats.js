// src/hooks/useProblemStats.js
import { useEffect, useRef, useState } from "react";

/**
 * 서버(또는 MSW 목) 계약:
 * GET /api/problems/:id/stats → { attempts: number, solved: number }
 *
 * 사용 예:
 * const { attempts, solved, loading, error } = useProblemStats(problemId, { pollMs: 10000 });
 */
export default function useProblemStats(problemId, { pollMs = 10000, endpoint } = {}) {
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const url =
    endpoint ??
    (problemId != null ? `/api/problems/${encodeURIComponent(problemId)}/stats` : null);

  const fetchOnce = async (signal) => {
    if (!url) return;
    try {
      setError(null);
      const res = await fetch(url, { cache: "no-store", signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAttempts(Number(data?.attempts ?? 0));
      setSolved(Number(data?.solved ?? 0));
      setLoading(false);
    } catch (e) {
      if (e?.name === "AbortError") return; // 언마운트 시 무시
      setError(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!problemId) return;

    const ctrl = new AbortController();
    // 즉시 1회
    fetchOnce(ctrl.signal);

    // 주기 폴링
    if (pollMs > 0) {
      timerRef.current = setInterval(() => fetchOnce(ctrl.signal), pollMs);
    }

    return () => {
      ctrl.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [problemId, url, pollMs]);

  return { attempts, solved, loading, error };
}

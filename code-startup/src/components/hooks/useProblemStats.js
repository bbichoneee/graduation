// src/hooks/useProblemStats.js
import { useEffect, useRef, useState } from "react";
import { http } from "../api/http";

const USE_STATS = (import.meta.env.VITE_USE_STATS_API ?? "1") !== "0";

/**
 * 안전한 통계 훅
 * - /stats 미구현/401/404 → {available:false} + 기본값 반환
 * - VITE_USE_STATS_API=0 → 네트워크 호출 자체 생략
 *
 * return: { attempts, solved, available, loading, error }
 */
export default function useProblemStats(
  problemId,
  { pollMs = 10000, endpoint } = {}
) {
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(0);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(Boolean(problemId));
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const url =
    endpoint ??
    (problemId != null ? `/api/problems/${encodeURIComponent(problemId)}/stats` : null);

  const fetchOnce = async (signal) => {
    // 스위치 OFF 또는 문제ID 없음 → 즉시 기본값
    if (!USE_STATS || !url) {
      setAttempts(0);
      setSolved(0);
      setAvailable(false);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      // axios는 signal을 config.signal로 전달 가능 (취소용)
      const res = await http.get(url, { cache: "no-store", signal });
      const data = res?.data ?? {};
      setAttempts(Number(data.attempts ?? 0));
      setSolved(Number(data.solved ?? 0));
      setAvailable(true);
      setLoading(false);
    } catch (e) {
      const status = e?.response?.status;
      // 401/404 → 구현 전/보안 포워드 → 기본값 + 사용불가로 처리 (에러로 터뜨리지 않음)
      if (status === 401 || status === 404) {
        setAttempts(0);
        setSolved(0);
        setAvailable(false);
        setLoading(false);
        setError(null);
        return;
      }
      if (e?.name === "CanceledError" || e?.name === "AbortError") {
        // 언마운트/취소
        return;
      }
      setAvailable(false);
      setLoading(false);
      setError(e);
    }
  };

  useEffect(() => {
    if (!problemId) {
      setAttempts(0);
      setSolved(0);
      setAvailable(false);
      setLoading(false);
      setError(null);
      return;
    }

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
    // url/pollMs가 바뀌면 재구독
  }, [problemId, url, pollMs]);

  return { attempts, solved, available, loading, error };
}

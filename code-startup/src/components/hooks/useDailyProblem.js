import { useEffect, useState } from "react";
import { fetchDailyProblem, fetchProblemStats, fetchProblemByOrderNum } from "../../api/problems";

/**
 * 지금 버전: 오늘의 문제를 불러오고 (id, orderNum, title, level)만 추출
 * 나중에 서버가 "오늘의 문제"를 내려주면, 이 파일 안의 구현만 교체하면 됨.
 */
export default function useDailyProblem({ enabled }) {
  const [data, setData] = useState(null);        // { id, orderNum, title, level, stats }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const rawDailyProblem = await fetchDailyProblem();
        if (!alive) return;

        // Extract orderNum and fetch full problem details and stats
        const orderNum = rawDailyProblem.orderNum;
        const [fullProblemDetails, stats] = await Promise.all([
          fetchProblemByOrderNum(orderNum),
          fetchProblemStats(orderNum),
        ]);
        if (!alive) return;

        // Combine daily problem details, full problem details, and stats
        const picked = {
          id: fullProblemDetails.id, // Use ID from full problem details
          orderNum: fullProblemDetails.orderNum,
          title: fullProblemDetails.title,
          level: fullProblemDetails.level, // Get level from full problem details
          description: fullProblemDetails.description, // Also include description
          status: rawDailyProblem.status, // From daily problem response
          date: rawDailyProblem.date,     // From daily problem response
          stats: stats, // Add stats to the data
        };
        setData(picked);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [enabled]);

  return { data, loading, error };
}

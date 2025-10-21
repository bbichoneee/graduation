// src/hooks/useDailyProblem.js
import { useEffect, useState } from "react";
import { fetchProblemById } from "../../api/problems";

/**
 * 지금 버전: 주어진 problemId로 문제를 불러오고 (id, title, level)만 추출
 * 나중에 서버가 "오늘의 문제"를 내려주면, 이 파일 안의 구현만 교체하면 됨.
 */
export default function useDailyProblem({ problemId }) {
  const [data, setData] = useState(null);        // { id, title, level }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchProblemById(problemId)
      .then((full) => {
        if (!alive) return;
        // 서버 스키마에 맞게 필요한 필드만 추출
        const picked = {
          id: full.id,
          title: full.title,
          level: full.level, // 없으면 null/undefined 허용
        };
        setData(picked);
      })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [problemId]);

  return { data, loading, error };
}

// src/components/qbank/TimeLimitBadge.jsx
import { useEffect, useMemo, useState } from "react";


/**
 * @param {boolean} isDaily        // 데일리 문제 여부
 * @param {string|number|Date} dailyResetAt  // 데일리 초기화 시각
 *   예: "2025-10-11T00:00:00+09:00" (서울 기준 ISO 형식)
 */


export default function TimeLimitBadge({ isDaily = false, dailyResetAt }) {
  if (!isDaily) {
    return <div className="badge bg-secondary">X</div>;
  }

  const resetMs = useMemo(() => new Date(dailyResetAt).getTime(), [dailyResetAt]);
  const deadline = resetMs + 24 * 60 * 60 * 1000; // 24h after reset
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remain = Math.max(0, deadline - now);
  const h = Math.floor(remain / 3600000);
  const m = Math.floor((remain % 3600000) / 60000);
  const s = Math.floor((remain % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className={`badge ${remain > 0 ? "bg-danger" : "bg-secondary"}`}>
      {remain > 0 ? `남은시간 ${pad(h)}:${pad(m)}:${pad(s)}` : "만료"}
    </div>
  );
}

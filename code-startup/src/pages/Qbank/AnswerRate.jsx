// src/components/qbank/AnswerRate.jsx
function clampPct(n) {
  if (n == null || isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * props:
 *  - available: boolean  (/stats 미구현/401/404면 false)
 *  - rate: 0~1 or null   (없으면 null)
 *  - solved: number
 *  - attempts: number
 *  - loading: boolean (선택)
 */
export default function AnswerRate({
  available,
  rate,
  solved = 0,
  attempts = 0,
  loading = false,
}) {
  if (loading) {
    return <span className="badge bg-secondary">불러오는 중…</span>;
  }

  if (!available) {
    return <span className="badge bg-secondary">집계 준비중</span>;
  }

  const pct = clampPct((rate ?? (attempts ? solved / attempts : 0)) * 100);

  return (
    <div className="d-flex align-items-center gap-2">
      <div className={`badge ${pct === 100 ? "bg-success" : "bg-info"} text-dark`}>
        {pct}%
      </div>
      <div className="progress" style={{ width: 120, height: 8 }}>
        <div className="progress-bar" role="progressbar" style={{ width: `${pct}%` }} />
      </div>
      {/* 필요하면 보조 정보 노출 */}
      {/* <div className="small text-muted">정답 {solved} / 시도 {attempts}</div> */}
    </div>
  );
}

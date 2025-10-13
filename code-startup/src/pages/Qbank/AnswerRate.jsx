// src/components/qbank/AnswerRate.jsx
import useProblemStats from "../../assets/useProblemStats";

function toRate(solved, attempts) {
  if (!attempts || attempts <= 0) return 0;
  const r = Math.round((solved / attempts) * 100);
  return Math.min(100, Math.max(0, r));
}

export default function AnswerRate({ problemId, pollMs = 10000, wsUrl }) {
  const { attempts, solved, loading, error } = useProblemStats(problemId, { pollMs, wsUrl });
  const rate = toRate(solved, attempts);

  return (
    <div className="d-flex align-items-center gap-2">
      <div className={`badge ${rate === 100 ? "bg-success" : "bg-info"} text-dark`}>
        {loading ? "…" : `${rate}%`}
      </div>
      <div className="progress" style={{ width: 120, height: 8 }}>
        <div className="progress-bar" role="progressbar" style={{ width: `${rate}%` }} />
      </div>
      {/* 보조 정보 (선택 노출) */}
      {/*<div className="small text-muted">
        {loading ? "업데이트 중" : `정답 ${solved} / 시도 ${attempts}`}
        {error ? " • 통계 갱신 오류" : ""}
      </div>*/}
    </div>
  );
}

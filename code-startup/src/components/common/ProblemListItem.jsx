// src/components/qbank/ProblemListItem.jsx
import { Link } from "react-router-dom";
import "./ProblemListItem.scss";


const LEVEL_ICON_SRC = "/img/star.jpg";

// 상태 → 배지 모드 매핑
const statusBadge = (status) => {
  switch (status) {
    case "solved":  return { text: "맞았음", mod: "pli-badge--success" };
    case "wrong":   return { text: "틀렸음", mod: "pli-badge--danger" };
    default:        return { text: "미도전", mod: "pli-badge--secondary" };
  }
};

// 숫자 안전 변환
const toNum = (v) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null; // null이면 '-'로 표시
};

export default function ProblemListItem({ problem, status = "unattempted" }) {
  const { id, title, orderNum } = problem;
  const level = toNum(problem.level);
  const badge = statusBadge(status);
  const uppoint = toNum(problem.uppoint);  

  return (
    <div className="problem-row">
      {/* 1열: 문제 번호 */}
      <div className="problem-cell problem-cell--no">#{orderNum}</div>

      {/* 2열: 제목 + 상태 배지 */}
      <div className="problem-cell problem-cell--title">
         <span className="problem-title">{title}</span>
      </div>

      {/* ✅ 3열: 내정보(미도전/맞았음/틀렸음) */}
      <div className="problem-cell problem-cell--me">
        <span className={`pli-badge ${badge.mod}`}>{badge.text}</span>
      </div>

      {/* ✅ 4열: UP 포인트 */}
      <div className="problem-cell problem-cell--point">
        {uppoint != null ? uppoint : "-"}
      </div>

      {/* ✅ 5열: 난이도 */}
      <div className="problem-cell problem-cell--level">
        <div className="level-icons" aria-hidden="true">
          {Array.from({ length: Math.max(0, Math.min(toNum(problem.level) ?? 0, 5)) }).map((_, i) => (
            <img className="level-icon" src={LEVEL_ICON_SRC} alt="" key={i} />
          ))}
        </div>
        {/* 접근성용 (시각 숨김) */}
        <span className="sr-only">난이도 {toNum(problem.level) ?? 0}</span>
      </div>

       {/* ✅ 행 전체를 덮는 투명 링크 */}
      <Link
        to={`/solveq/${orderNum}`}
        className="problem-row__link"
        aria-label={`문제 ${orderNum} ${title} 페이지로 이동`}
      />
    </div>
  );
}

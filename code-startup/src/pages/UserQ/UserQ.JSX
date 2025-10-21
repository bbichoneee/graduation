// src/pages/UserQ/UserQ.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuBar from "../../components/common/MenuBar";
import "./UserQ.scss";
import UserCard from "../../components/common/UserCard";
import useDailyProblem from "../../components/hooks/useDailyProblem";

// 자정까지 남은 시간
const nextMidnight = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
};
const fmt = (ms) => {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
};

export default function UserQ() {
  const navigate = useNavigate();

  // 🔹 지금은 “1번 문제”를 데일리로 가정 (SolveQ 스타일 로드)
  const DAILY_PROBLEM_ID = 1;
  const { data: daily, loading, error } = useDailyProblem({ problemId: DAILY_PROBLEM_ID });

  const [remain, setRemain] = useState(fmt(nextMidnight() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setRemain(fmt(nextMidnight() - Date.now())), 1000);
    return () => clearInterval(t);
  }, []);

  const onClickDaily = () => {
    if (!daily) return;
    navigate(`/solveq/${daily.id}`); // 라우팅 규약에 맞게 수정
  };

  return (
    <div>
      <MenuBar />
      <div className="contents">
        <div className="lefts">
          <UserCard />
          <div className="btn-group-vertical leftbtn">
            <button type="button" className="btn btn-outline-dark choicebtn" id
            ="firstbtn">데일리 문제</button>
            <button type="button" className="btn btn-outline-dark choicebtn">취약 문제 풀기</button>
          </div>
        </div>

        <div className="rights">
            <div className="rights-head">
                <div className="rights-timer">문제 초기화까지 남은 시간 : {remain}</div>
            </div>
            <div className="rights-body">
                <div
                    className="daily-card"
                    role="button"
                    tabIndex={0}
                    onClick={onClickDaily}
                    onKeyDown={(e) => (e.key === "Enter" ? onClickDaily() : null)}
                >
                    {loading && <div className="daily-loading">불러오는 중…</div>}
                    {error && <div className="daily-loading">불러오기 실패: {String(error.message || error)}</div>}
                    {(!loading && !error && daily) && (
                    <>
                        <div className="daily-meta">
                        <span className="daily-id">#{daily.id}</span>
                        <span className="daily-level">Lv.{daily.level ?? "?"}</span>
                        </div>
                        <div className="daily-title">{daily.title}</div>
                        <div className="daily-cta">바로 풀러 가기 →</div>
                    </>
                    )}
                </div>
            </div>

          <div className="rights-footer">하루에 하나씩이라도 풀자</div>
        </div>
      </div>
    </div>
  );
}

// src/pages/UserQ/UserQ.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuBar from "../../components/common/MenuBar";
import "./UserQ.scss";
import UserCard from "../../components/common/UserCard";
import useDailyProblem from "../../components/hooks/useDailyProblem";
import {
  getTodayKey,
  getCurrentDailyId,
  getNextDailyIdPreview,
  onDailyProgressChange,
} from "../../lib/dailyProgress";

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

  // 초기엔 아무것도 선택 안 함
  const [view, setView] = useState("none"); // 'none' | 'daily'

  // 데일리 문제(지금은 1번 고정)
  const DAILY_PROBLEM_ID = 1;
  const { data: daily, loading, error } = useDailyProblem({
    problemId: DAILY_PROBLEM_ID,
    // 훅이 지원한다면: 선택 전엔 요청도 막기
    enabled: view === "daily",
  });

  // 타이머
  const [remain, setRemain] = useState(fmt(nextMidnight() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setRemain(fmt(nextMidnight() - Date.now())), 1000);
    return () => clearInterval(t);
  }, []);

  const openDaily = () => setView("daily");
  const goSolve = () => {
    if (!daily) return;
    navigate(`/solveq/${daily.id}`);
  };

  return (
    <div>
      <MenuBar />
      <div className="contents">
        <div className="lefts">
          <UserCard />
          <div className="btn-group-vertical leftbtn">
            <button
              type="button"
              className={`btn btn-outline-dark choicebtn ${view === "daily" ? "active" : ""}`}
              id="firstbtn"
              onClick={openDaily}
              aria-pressed={view === "daily"}
            >
              데일리 문제
            </button>
            <button
              type="button"
              className="btn btn-outline-dark choicebtn"
              onClick={() => setView("none")}
              aria-pressed={view === "none"}
            >
              취약 문제 유형
            </button>
          </div>
        </div>

        <div className="rights">
          {/* 아무 것도 선택 안 했을 때: 안내만 */}
          {view === "none" ? (
            <div className="rights--empty">
              <div className="placeholder-title point">메뉴를 선택하세요</div>
            </div>
          ) : (
            /* 데일리 선택 시에만 헤더/바디/푸터 표시 */
            <>
              <div className="rights-head">
                <div className="rights-timer">문제 초기화까지 남은 시간 : {remain}</div>
              </div>

              <div className="rights-body">
                <div
                  className="daily-card"
                  role="button"
                  tabIndex={0}
                  onClick={goSolve}
                  onKeyDown={(e) => (e.key === "Enter" ? goSolve() : null)}
                >
                  {loading && <div className="daily-loading">불러오는 중…</div>}
                  {error && (
                    <div className="daily-loading">불러오기 실패: {String(error.message || error)}</div>
                  )}
                  {!loading && !error && daily && (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

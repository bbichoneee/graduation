import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuBar from "../../components/common/MenuBar";
import "./UserQ.scss";
import UserCard from "../../components/common/UserCard";
import useDailyProblem from "../../components/hooks/useDailyProblem";
import { fetchWeakestProblemType, fetchCurrentUser } from "../../api/user";
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
  const [view, setView] = useState("none"); // 'none' | 'daily' | 'weakest'

  // 현재 로그인한 사용자 정보
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoadingUser(true);
    setErrorUser(null);
    fetchCurrentUser()
      .then(user => { if (mounted) setCurrentUser(user); })
      .catch(e => { if (mounted) setErrorUser(e); })
      .finally(() => { if (mounted) setLoadingUser(false); });
    return () => { mounted = false; };
  }, []);

  // 데일리 문제
  const { data: daily, loading: loadingDaily, error: errorDaily } = useDailyProblem({
    enabled: view === "daily",
  });

  // 취약 문제 유형
  const [weakestType, setWeakestType] = useState(null);
  const [loadingWeakestType, setLoadingWeakestType] = useState(false);
  const [errorWeakestType, setErrorWeakestType] = useState(null);

  // 타이머
  const [remain, setRemain] = useState(fmt(nextMidnight() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setRemain(fmt(nextMidnight() - Date.now())), 1000);
    return () => clearInterval(t);
  }, []);

  const openDaily = () => setView("daily");
  const openWeakest = async () => {
    setView("weakest");
    if (!currentUser?.id) {
      setErrorWeakestType("로그인한 사용자 정보를 찾을 수 없습니다.");
      return;
    }

    setLoadingWeakestType(true);
    setErrorWeakestType(null);
    try {
      const data = await fetchWeakestProblemType(currentUser.id);
      setWeakestType(data);
    } catch (e) {
      setErrorWeakestType(e?.message || "취약 유형을 불러오지 못했습니다.");
    } finally {
      setLoadingWeakestType(false);
    }
  };

  const goSolveDaily = () => {
    if (!daily) return;
    navigate(`/solveq/${daily.orderNum}`);
  };

  const goToQbankWeakestType = () => {
    if (!weakestType?.tag) return;
    navigate(`/qbank?tag=${encodeURIComponent(weakestType.tag)}`);
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
              className={`btn btn-outline-dark choicebtn ${view === "weakest" ? "active" : ""}`}
              onClick={openWeakest}
              aria-pressed={view === "weakest"}
              disabled={loadingUser || !currentUser}
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
          ) : view === "daily" ? (
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
                  onClick={goSolveDaily}
                  onKeyDown={(e) => (e.key === "Enter" ? goSolveDaily() : null)}
                >
                  {loadingDaily && <div className="daily-loading">불러오는 중…</div>}
                  {errorDaily && (
                    <div className="daily-loading">불러오기 실패: {String(errorDaily.message || errorDaily)}</div>
                  )}
                  {!loadingDaily && !errorDaily && daily && (
                    <>
                      <div className="daily-meta">
                        <span className="daily-id">#{daily.orderNum}</span>
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
          ) : view === "weakest" ? (
            <>
              <div className="rights-head">
                <div className="rights-timer">취약 유형 분석 결과</div>
              </div>
              <div className="rights-body">
                {loadingUser || loadingWeakestType ? (
                  <div className="daily-loading">분석 중…</div>
                ) : errorUser ? (
                  <div className="daily-loading">사용자 정보 로드 실패: {String(errorUser)}</div>
                ) : errorWeakestType ? (
                  <div className="daily-loading">분석 실패: {String(errorWeakestType)}</div>
                ) : weakestType && weakestType.tag !== "N/A" ? (
                  <div className="weakest-type-card">
                    <p className="weakest-type-message">
                      당신의 취약 유형은 
                      <span className="highlight">'{weakestType.tag}'</span>
                      입니다.
                    </p>
                    <p className="weakest-type-rate">
                      (평균 정답률: {(weakestType.averageCorrectRate * 100).toFixed(2)}%)
                    </p>
                    <button 
                      type="button"
                      className="btn btn-primary mt-3"
                      onClick={goToQbankWeakestType}
                    >
                      해당 유형 집중공략하기 →
                    </button>
                  </div>
                ) : (
                  !loadingWeakestType && !errorWeakestType && (!weakestType || weakestType.tag === "N/A") && (
                    <div className="weakest-type-card">
                      <p className="weakest-type-message">
                        데이터가 부족합니다! 문제를 풀어주세요.
                      </p>
                      <button 
                        type="button"
                        className="btn btn-primary custom_btn"
                        onClick={() => navigate("/qbank")}
                      >
                        문제풀러가기 →
                      </button>
                    </div>
                  )
                )}
              </div>
              <div className="rights-footer">꾸준히 노력하면 극복할 수 있습니다!</div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

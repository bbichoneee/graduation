import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MenuBar from "../../components/common/MenuBar";
import ProfileCard from "../../components/common/ProfileCard";
import { http } from "../../api/http";
import { fetchMyRank } from "../../api/ranking";
import "./MyPage.scss";

const FILTERS = { ALL: "all", CORRECT: "ac", WRONG: "wa" };

export default function MyPage() {
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ solvedCount: 0, correctCount: 0, wrongCount: 0 });
  const [myRank, setMyRank] = useState(null);
  const [myProfile, setMyProfile] = useState(null); // New state for user profile
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const [statsRes, subsRes, rankRes, profileRes] = await Promise.all([ // Added profileRes
          http.get("/api/users/me/stats"),
          http.get("/api/submissions/me", { params: { limit: 200, result: filter } }),
          fetchMyRank(),
          http.get("/api/users/me"), // Fetch user profile
        ]);

        if (!mounted) return;
        setStats({
          solvedCount: statsRes.data?.attemptedProblems ?? 0,
          correctCount: statsRes.data?.correctProblems ?? 0,
          wrongCount: statsRes.data?.incorrectProblems ?? 0,
        });
        setSubmissions(Array.isArray(subsRes.data) ? subsRes.data : []);
        setMyRank(rankRes);
        setMyProfile(profileRes.data); // Set user profile data
      } catch (e) {
        if (!mounted) return;
        setLoadErr(e?.message ?? "불러오기 실패");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [filter]);

  const rows = useMemo(() => submissions, [submissions]);

  return (
    <div className="mypage-root mypage-root--light">
      <MenuBar />
      <div className="mypage-layout">
        {/* 왼쪽: 프로필 */}
        <aside className="left-col">
          <ProfileCard
            nickname={myProfile?.nickname} // From users/me
            profileImageUrl={myProfile?.profileImageUrl} // From users/me
            totalPoints={myRank?.points} // From ranking/me
          />
        </aside>

        {/* 오른쪽: 요약 + 히스토리 */}
        <main className="right-col">
          {/* 사용자 요약 (정확도 제거) */}
          <section className="card-block">
            <header className="card-title-row">
              <h2 className="card-title">내 풀이 요약</h2>
            </header>

            {loading ? (
              <div className="skeleton">로딩 중…</div>
            ) : (
              <div className="stats-grid">
                <div className="stat">
                  <div className="label">푼 문제 수</div>
                  <div className="value">{stats.solvedCount}</div>
                </div>
                <div className="stat">
                  <div className="label">맞은 문제 수</div>
                  <div className="value value--good">{stats.correctCount}</div>
                </div>
                <div className="stat">
                  <div className="label">틀린 문제 수</div>
                  <div className="value value--bad">{stats.wrongCount}</div>
                </div>
                <div className="stat">
                  <div className="label">정답률</div>
                  <div className="value">{stats.solvedCount > 0 ? ((stats.correctCount / stats.solvedCount) * 100).toFixed(2) + "%" : "0%"}</div>
                </div>
              </div>
            )}
          </section>

          {/* 풀이 히스토리 (날짜 / 문제번호 / 문제 제목 / 포인트 / 결과) */}
          <section className="card-block">
            <header className="card-title-row">
              <h2 className="card-title">풀이 히스토리</h2>
              <div className="filters">
                <select
                  className="filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value={FILTERS.ALL}>All</option>
                  <option value={FILTERS.CORRECT}>정답만 보기</option>
                  <option value={FILTERS.WRONG}>오답만 보기</option>
                </select>
              </div>
            </header>

            {loading ? (
              <div className="skeleton">로딩 중…</div>
            ) : (
              <div className="table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>문제번호</th>
                      <th>문제 제목</th>
                      <th>포인트</th>
                      <th>결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty">표시할 기록이 없습니다.</td>
                      </tr>
                    ) : (
                      rows.map((row) => {
                        const when =
                          row.submittedAt || row.createdAt || row.created_at || new Date().toISOString();
                        const pid = row.problemId ?? row.problem_id ?? row.problem?.id;
                        const title = row.problemTitle ?? row.problem?.title ?? (pid ? `#${pid}` : "-");
                        const pts = row.points ?? row.score ?? row.problem?.score ?? "-";
                        const res = (row.result || "").toUpperCase();
                        const isAC = res === "SUCCESS" || res === "AC";

                        return (
                          <tr key={row.id ?? when}>
                            <td>{new Date(when).toLocaleString()}</td>
                            <td>{pid ?? "-"}</td>
                            <td className="problem">
                              {pid ? (
                                <Link className="link" to={`/solveq/${pid}`}>{title}</Link>
                              ) : (
                                title
                              )}
                            </td>
                            <td>{pts}</td>
                            <td>
                              <span className={`pill ${isAC ? "pill--good" : "pill--bad"}`}>
                                {isAC ? "정답" : "오답"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

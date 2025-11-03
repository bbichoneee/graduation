import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MenuBar from "../../components/common/MenuBar";
import ProfileCard from "../../components/common/ProfileCard";
import { http } from "../../api/http";
import { fetchUserById } from "../../api/user";
import "../MyPage/MyPage.scss"; // Re-use MyPage styles

const FILTERS = { ALL: "all", CORRECT: "ac", WRONG: "wa" };

export default function UserProfilePage() {
  const { userId } = useParams();
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ solvedCount: 0, correctCount: 0, wrongCount: 0 });
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const [statsRes, subsRes, profileRes] = await Promise.all([
          http.get(`/api/users/${userId}/stats`),
          http.get(`/api/submissions`, { params: { userId, limit: 200, result: filter } }),
          fetchUserById(userId),
        ]);

        if (!mounted) return;
        setStats({
          solvedCount: statsRes.data?.solvedCount ?? 0,
          correctCount: statsRes.data?.correctCount ?? 0,
          wrongCount: statsRes.data?.wrongCount ?? 0,
        });
        setSubmissions(Array.isArray(subsRes.data) ? subsRes.data : []);
        setUserProfile(profileRes);
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
  }, [userId, filter]);

  const rows = useMemo(() => submissions, [submissions]);

  return (
    <div className="mypage-root mypage-root--light">
      <MenuBar />
      <div className="mypage-layout">
        {/* 왼쪽: 프로필 */}
        <aside className="left-col">
          <ProfileCard
            nickname={userProfile?.nickname}
            profileImageUrl={userProfile?.profileImageUrl}
            totalPoints={userProfile?.totalPoints}
            title={`'${userProfile?.nickname}'님의 프로필`}
          />
        </aside>

        {/* 오른쪽: 요약 + 히스토리 */}
        <main className="right-col">
          {loading && !userProfile ? (
            <p>로딩 중...</p>
          ) : loadErr ? (
            <p className="text-danger">{loadErr}</p>
          ) : userProfile ? (
            <>
              {/* 사용자 요약 */}
              <section className="card-block">
                <header className="card-title-row">
                  <h2 className="card-title">{userProfile.nickname}님의 풀이 요약</h2>
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

              {/* 풀이 히스토리 */}
              <section className="card-block">
                <header className="card-title-row">
                  <h2 className="card-title">{userProfile.nickname}님의 풀이 히스토리</h2>
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
            </>
          ) : (
            <p>사용자 정보를 찾을 수 없습니다.</p>
          )}
        </main>
      </div>
    </div>
  );
}

// src/pages/Ranking/Ranking.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MenuBar from "../../components/common/MenuBar";
import UserCard from "../../components/common/UserCard";
import SecureAvatar from "../../components/common/SecureAvatar";
import { fetchRanking } from "../../api/ranking";
import { fetchCurrentUser } from "../../api/user";
import { http } from "../../api/http";
import { withBase } from "../../utils/resolveIamgeUrl";
import "./Ranking.scss";
import "../MyPage/MyPage.scss"; // ⬅️ 마이페이지 스타일 재사용

export default function Ranking() {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  // ⬇️ 유저 클릭 시 보여줄 '임베디드 마이페이지'용 상태
  const [selected, setSelected] = useState(null);
  // selected 구조: { user: {...}, score: number }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadErr(null);
        const [meRes, ranking] = await Promise.all([
          fetchCurrentUser().catch(() => null),
          fetchRanking(),
        ]);
        setMe(meRes);
        setRows(Array.isArray(ranking) ? ranking : []);
      } catch (e) {
        setLoadErr(e?.message || "랭킹을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 화면엔 Top 100만
  const displayRows = useMemo(() => rows.slice(0, 100), [rows]);

  // 내 등수는 전체 rows 기준
  const myRankInfo = useMemo(() => {
    if (!me || !Array.isArray(rows) || rows.length === 0) return null;
    const idx = rows.findIndex((r) => r?.user?.id === me?.id);
    if (idx === -1) return null;
    const score = Number.isFinite(rows[idx]?.totalScore) ? rows[idx].totalScore : 0;
    return { rank: idx + 1, score };
  }, [me, rows]);

  // ⬇️ 유저 클릭 핸들러: 랭킹 → 유저 상세 뷰로 전환
  const openUserDetail = (row, rank) => {
    const score = Number.isFinite(row?.totalScore) ? row.totalScore : 0;
    setSelected({ user: row?.user, score, rank });
  };

  // ⬇️ 상세 뷰에서 Back
  const closeUserDetail = () => setSelected(null);

  return (
    <div className="ranking-page">
      <MenuBar />

      {/* 상세 뷰가 선택되었으면 임베디드 마이페이지 렌더 */}
      {selected ? (
        <EmbeddedUserPage
          user={selected.user}
          baseScore={selected.score}
          onBack={closeUserDetail}
        />
      ) : (
        <div className="ranking-layout">
          {/* 좌측: 기존 UserCard 유지 + 내 순위 칩 */}
          <aside className="ranking-sidebar">
            <UserCard />
            <div className="my-rank-chip">
              {myRankInfo ? (
                <>
                  <span className="chip-rank">내 순위 #{myRankInfo.rank}</span>
                  <span className="chip-score">{myRankInfo.score}점</span>
                </>
              ) : (
                <span className="chip-rank off">아직 랭킹에 기록이 없습니다</span>
              )}
            </div>
          </aside>

          {/* 우측: 랭킹 표 */}
          <main className="ranking-content">
            <section className="rankingbox card shadow-sm">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h2 className="title m-0">전체 랭킹</h2>
                <span className="count text-muted">
                  표시: {displayRows.length}명 (상위 100)
                </span>
              </div>

              <div className="card-body p-0">
                {loading ? (
                  <SkeletonTable />
                ) : loadErr ? (
                  <div className="p-4 text-danger">{String(loadErr)}</div>
                ) : displayRows.length ? (
                  <ol className="ranking-list list-unstyled m-0">
                    {displayRows.map((r, i) => {
                      const rank = i + 1;
                      const medal =
                        rank === 1
                          ? { label: "🥇", cls: "gold" }
                          : rank === 2
                          ? { label: "🥈", cls: "silver" }
                          : rank === 3
                          ? { label: "🥉", cls: "bronze" }
                          : null;

                      const isMe = me && r?.user?.id === me?.id;
                      const score = Number.isFinite(r?.totalScore) ? r.totalScore : 0;

                      const name =
                        r?.user?.nickname ||
                        r?.user?.username ||
                        `User#${r?.user?.id ?? "?"}`;

                      return (
                        <li
                          key={r.id ?? `${r?.user?.id}-${rank}`}
                          className={`ranking-row ${isMe ? "me" : ""}`}
                          role="button"
                          onClick={() => openUserDetail(r, rank)}
                          title={`${name} 상세 보기`}
                        >
                          {/* 1) 순위 */}
                          <div className="rank-col">
                            {medal ? (
                              <span className={`medal ${medal.cls}`}>{medal.label}</span>
                            ) : (
                              <span className="rank-number">#{rank}</span>
                            )}
                          </div>

                          {/* 2) 아바타 */}
                          <div className="avatar-col">
                            <SecureAvatar
                              size={44}
                              className="avatar"
                              candidates={[
                                r?.user?.profileImageUrl,
                                r?.user?.id && `/files/profile/${r.user.id}.jpg`,
                                r?.user?.id && `/files/profile/${r.user.id}.png`,
                                r?.user?.username && `/files/profile/${r.user.username}.jpg`,
                                r?.user?.username && `/files/profile/${r.user.username}.png`,
                                `https://api.dicebear.com/9.x/identicon/svg?seed=${
                                  encodeURIComponent(
                                    r?.user?.nickname ||
                                      r?.user?.username ||
                                      `User#${r?.user?.id ?? ""}`
                                  )
                                }`,
                                "/img/default_profile.jpg",
                              ].filter(Boolean)}
                            />
                          </div>

                          {/* 3) 유저 메타 */}
                          <div className="user-col">
                            <div className="meta">
                              <div className="name">{name}</div>
                            </div>
                          </div>

                          {/* 4) 점수 */}
                          <div className="score-col">
                            <span className="score">{score}</span>
                            <span className="unit">점</span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <div className="p-4 text-muted">아직 랭킹 데이터가 없습니다.</div>
                )}
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="skeleton-wrap">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="skeleton-row" key={i} />
      ))}
    </div>
  );
}

/* ===========================================================
   임베디드 마이페이지
   - 랭킹 페이지 안에서 특정 유저의 요약/히스토리를 보여줌
   - MyPage 레이아웃/스타일을 최대한 그대로 재사용
   =========================================================== */
function EmbeddedUserPage({ user, baseScore, onBack }) {
  const userId = user?.id;
  const displayName = user?.nickname || user?.username || `User#${userId ?? ""}`;

  const [filter, setFilter] = useState("all"); // all | ac | wa
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ solvedCount: 0, correctCount: 0, wrongCount: 0 });
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        // ⬇️ 백엔드 경로는 프로젝트에 맞게 조정
        const [statsRes, subsRes] = await Promise.all([
          http.get(`/api/users/${userId}/stats`),
          http.get(`/api/submission`, {
            params: { userId, limit: 200, result: filter },
          }),
        ]);

        if (!mounted) return;
        setStats({
          solvedCount: statsRes.data?.solvedCount ?? 0,
          correctCount: statsRes.data?.correctCount ?? 0,
          wrongCount: statsRes.data?.wrongCount ?? 0,
        });
        setSubmissions(Array.isArray(subsRes.data) ? subsRes.data : []);
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
      {/* MenuBar는 상단에서 이미 렌더됨 */}

      <div className="mypage-layout">
        {/* 왼쪽: 간단 공개 프로필 패널 */}
        <aside className="left-col">
          <div className="profile-pane">
            <div className="profile-card">
              <div className="profile-header">'{displayName}'님의 프로필</div>
              <div className="profile-body">
                <div className="two_content top">
                  <div className="avatar-wrap">
                    <SecureAvatar
                      size={100}
                      className="profile-image"
                      candidates={[
                        withBase(user?.profileImageUrl),
                        user?.id && `/files/profile/${user.id}.jpg`,
                        user?.id && `/files/profile/${user.id}.png`,
                        user?.username && `/files/profile/${user.username}.jpg`,
                        user?.username && `/files/profile/${user.username}.png`,
                        `https://api.dicebear.com/9.x/identicon/svg?seed=${
                          encodeURIComponent(displayName)
                        }`,
                        "/img/default_profile.jpg",
                      ].filter(Boolean)}
                    />
                  </div>

                  <p className="profile-nickname">
                    <span className="nickname">{displayName}</span>
                  </p>
                </div>

                <div className="two_content points">
                  <div className="points-label">Up 포인트</div>
                  <div className="points-value">{Number(baseScore || 0).toLocaleString()} points</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* 오른쪽: 요약 + 히스토리 */}
        <main className="right-col">
          {/* 사용자 요약 */}
          <section className="card-block">
            <header className="card-title-row">
              <h2 className="card-title">{displayName} 님 풀이 요약</h2>
            </header>

            {loading ? (
              <div className="skeleton">로딩 중…</div>
            ) : loadErr ? (
              <div className="error">{String(loadErr)}</div>
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
                  <div className="value">
                    {stats.solvedCount > 0
                      ? ((stats.correctCount / stats.solvedCount) * 100).toFixed(2) + "%"
                      : "0%"}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 풀이 히스토리 + Back 버튼 */}
          <section className="card-block">
            <header className="card-title-row">
              <h2 className="card-title">풀이 히스토리</h2>
              <div className="filters" style={{ gap: 8 }}>
                <select
                  className="filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="ac">정답만 보기</option>
                  <option value="wa">오답만 보기</option>
                </select>
              </div>
            </header>

            {loading ? (
              <div className="skeleton">로딩 중…</div>
            ) : loadErr ? (
              <div className="error">{String(loadErr)}</div>
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
            <button type="button" className="btn btn-sm btn-outline-secondary back-button" onClick={onBack}>Back</button>
        </main>
      </div>
    </div>
  );
}


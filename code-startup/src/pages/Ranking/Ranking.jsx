// src/pages/Ranking/Ranking.jsx
import { useEffect, useMemo, useState } from "react";
import MenuBar from "../../components/common/MenuBar";
import UserCard from "../../components/common/UserCard";
import SecureAvatar from "../../components/common/SecureAvatar";
import { fetchRanking } from "../../api/ranking";
import { fetchCurrentUser } from "../../api/user";
import { buildAvatarCandidates, withBase } from "../../utils/resolveIamgeUrl";
import "./Ranking.scss";

export default function Ranking() {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

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

  // 내 등수는 전체 rows 기준 (0점/100등 밖이어도 표시)
  const myRankInfo = useMemo(() => {
    if (!me || !Array.isArray(rows) || rows.length === 0) return null;
    const idx = rows.findIndex((r) => r?.user?.id === me?.id);
    if (idx === -1) return null;
    const score = Number.isFinite(rows[idx]?.totalScore) ? rows[idx].totalScore : 0;
    return { rank: idx + 1, score };
  }, [me, rows]);

  return (
    <div className="ranking-page">
      <MenuBar />

      <div className="ranking-layout">
        {/* 좌측: 기존 UserCard 유지 */}
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

        {/* 우측: 랭킹 */}
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
                <div className="p-4 text-danger">{loadErr}</div>
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

                    // 후보 URL 생성: 1) 서버값(상대/절대), 2) id/username 패턴 추정, 3) 아이덴티콘, 4) 디폴트
                    const serverUrl = withBase(r?.user?.profileImageUrl);
                    const candidates = buildAvatarCandidates(r?.user, serverUrl);

                    const name =
                      r?.user?.nickname ||
                      r?.user?.username ||
                      `User#${r?.user?.id ?? "?"}`;

                    return (
                      <li
                        key={r.id ?? `${r?.user?.id}-${rank}`}
                        className={`ranking-row ${isMe ? "me" : ""}`}
                      >
                        {/* 1) 순위 */}
                        <div className="rank-col">
                          {medal ? (
                            <span className={`medal ${medal.cls}`}>{medal.label}</span>
                          ) : (
                            <span className="rank-number">#{rank}</span>
                          )}
                        </div>

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
                                    encodeURIComponent(r?.user?.nickname || r?.user?.username || `User#${r?.user?.id ?? ""}`)
                                    }`,
                                    "/img/default_profile.jpg",
                                ].filter(Boolean)}
                            />

                            </div>

                        {/* 3) 유저 메타 */}
                        <div className="user-col">
                          <div className="meta">
                            <div className="name">{name}</div>
                            <div className="sub text-muted">ID: {r?.user?.id ?? "-"}</div>
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

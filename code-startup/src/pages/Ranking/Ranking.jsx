// src/pages/Ranking/Ranking.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuBar from "../../components/common/MenuBar";
import UserCard from "../../components/common/UserCard";
import SecureAvatar from "../../components/common/SecureAvatar";
import { fetchRanking, fetchMyRank } from "../../api/ranking";
import "./Ranking.scss";

export default function Ranking() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [myRank, setMyRank] = useState(null); // 내 랭킹 정보
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadErr(null);
        const [myRankRes, ranking] = await Promise.all([
          fetchMyRank().catch(() => null), // 내 랭킹
          fetchRanking(), // 전체 랭킹
        ]);

        setMyRank(myRankRes);
        setMe(myRankRes?.user ?? null); // 내 정보 설정
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

  // 내 등수는 API로부터 직접 받은 값 사용
  const myRankInfo = useMemo(() => {
    if (!myRank) return null;
    return {
      rank: myRank.rank,
      score: myRank.points,
    };
  }, [myRank]);

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="ranking-page">
      <MenuBar />
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

                    const isMe = me && r?.id === me?.id;
                    const score = Number.isFinite(r?.points) ? r.points : 0;

                    const name =
                      r?.nickname ||
                      r?.username ||
                      `User#${r?.id ?? "?"}`;

                    return (
                      <li
                        key={r.id ?? `${r?.id}-${rank}`}
                        className={`ranking-row ${isMe ? "me" : ""}`}
                        role="button"
                        onClick={() => handleUserClick(r.userId)}
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
                              r?.profileImageUrl,
                              r?.id && `/files/profile/${r.id}.jpg`,
                              r?.id && `/files/profile/${r.id}.png`,
                              r?.username && `/files/profile/${r.username}.jpg`,
                              r?.username && `/files/profile/${r.username}.png`,
                              `https://api.dicebear.com/9.x/identicon/svg?seed=${
                                encodeURIComponent(
                                  r?.nickname ||
                                    r?.username ||
                                    `User#${r?.id ?? ""}`
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


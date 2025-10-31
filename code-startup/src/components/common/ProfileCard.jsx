
// 변경점 요약:
// 1) fetchMyRank 제거, 대신 http.get("/api/ranking")로 전체 랭킹 받아서 내 순위 계산
// 2) 동점(같은 totalScore) 동일 순위 처리 (standard competition ranking)

import { useEffect, useMemo, useRef, useState } from "react";
import { MdAddAPhoto } from "react-icons/md";
import "./ProfileCard.scss";
import { fetchCurrentUser } from "../../api/user";
import { ensureAccessToken, http } from "../../api/http"; // ⬅️ http 추가

function ProfileCard({
  nickname: nicknameProp,
  profileImageUrl: profileImageUrlProp,
  totalPoints: totalPointsProp,
  onChangePhoto,
}) {
  const fileInputRef = useRef(null);

  const [me, setMe] = useState(null);
  const [rank, setRank] = useState(null);     // ⬅️ 순위 상태
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const reqIdRef = useRef(0);

  const nickname = useMemo(
    () => nicknameProp ?? me?.nickname ?? "사용자",
    [nicknameProp, me]
  );
  const avatarUrl = useMemo(
    () => profileImageUrlProp ?? me?.profileImageUrl ?? "",
    [profileImageUrlProp, me]
  );
  const totalPoints = useMemo(
    () => totalPointsProp ?? me?.cachedTotalPoints ?? me?.totalPoints ?? 0,
    [totalPointsProp, me]
  );

  const fallbackSvgDataUrl = useMemo(
    () =>
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
          <rect width='100%' height='100%' fill='#f2f4f6'/>
          <circle cx='100' cy='80' r='40' fill='#d9dee3'/>
          <rect x='45' y='130' width='110' height='40' rx='20' fill='#d9dee3'/>
        </svg>
      `),
    []
  );

  // ⬇️ 동점 처리 포함한 순위 계산 (standard competition ranking)
  function computeMyRank(sortedList, myUserId) {
    // 기대 형태: [{ id, totalScore, user: { id, ... } }, ...] desc
    if (!Array.isArray(sortedList) || !myUserId) return null;

    let currentRank = 0;      // 현재 할당할 랭크
    let processed = 0;        // 처리한 항목 수
    let prevScore = null;

    for (const row of sortedList) {
      processed += 1;
      const score = row?.totalScore ?? 0;

      if (prevScore === null || score !== prevScore) {
        currentRank = processed; // 새로운 점수면 현재까지 처리한 개수 = 랭크
        prevScore = score;
      }
      const rowUserId = row?.user?.id ?? row?.user_id ?? row?.userId;
      if (rowUserId === myUserId) {
        return currentRank; // 동점이면 동일 랭크 반환
      }
    }
    return null;
  }

  // me + ranking 불러와서 순위 계산
  useEffect(() => {
    // 부모가 모두 내려주면 API 호출 생략 (닉/이미지/포인트만으로는 순위는 모름 → 호출 필요)
    let alive = true;
    const myReq = ++reqIdRef.current;

    (async () => {
      try {
        setLoading(true);
        setLoadErr(null);
        await ensureAccessToken();

        // 1) 내 정보
        const meData = await fetchCurrentUser(); // { id, username, nickname, ... }
        if (!alive || myReq !== reqIdRef.current) return;
        setMe(meData ?? null);

        // 2) 전체 랭킹
        const { data: rankingList } = await http.get("/api/ranking");
        if (!alive || myReq !== reqIdRef.current) return;

        // 안전: 혹시 정렬 보장이 없다면 점수 내림차순으로 한번 더 정렬
        const sorted = Array.isArray(rankingList)
          ? [...rankingList].sort((a, b) => (b?.totalScore ?? 0) - (a?.totalScore ?? 0))
          : [];

        const myRank = computeMyRank(sorted, meData?.id);
        setRank(myRank);
      } catch (e) {
        if (!alive || myReq !== reqIdRef.current) return;
        setLoadErr(e?.response?.data || e?.message || "프로필/랭킹 정보를 불러오지 못했습니다.");
      } finally {
        if (alive && myReq === reqIdRef.current) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [nicknameProp, profileImageUrlProp, totalPointsProp]);

  const handleClickEdit = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChangePhoto?.(file);
    e.target.value = "";
  };

  const pointsText =
    typeof totalPoints === "number"
      ? totalPoints.toLocaleString()
      : totalPoints ?? 0;

  const rankText =
    Number.isFinite(rank) ? `#${Number(rank).toLocaleString()}` : "-";

  return (
      <div className="profile-card">
        <div className="profile-header">내 프로필</div>

        <div className="profile-body">
          <div className="two_content top">
            <div className="avatar-wrap">
              <img className="profile-image" src={avatarUrl || fallbackSvgDataUrl} alt="프로필" />
              <button
                type="button"
                className="edit-photo-btn"
                onClick={handleClickEdit}
                aria-label="프로필 사진 변경"
                title="프로필 사진 변경"
              >
                <MdAddAPhoto size={18} />
              </button>
              <input
                ref={fileInputRef}
                className="visually-hidden"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="profile-nickname">
              {loading ? (
                <span className="nickname">불러오는 중...</span>
              ) : (
                <>
                  <span className="nickname">"{nickname}"</span>님
                </>
              )}
            </div>
          </div>

          <div className="two_content points">
            <div className="points-label">Up 포인트</div>
            <div className="points-value">{pointsText} points</div>
          </div>

          {/* 새 섹션: 내 랭킹 순위 */}
          <div className="two_content rank">
            <div className="points-label">랭킹 순위</div>
            <div className="points-value">{rankText}</div>
          </div>

        </div>
      </div>
  );
}

export default ProfileCard;

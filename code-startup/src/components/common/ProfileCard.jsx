
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdAddAPhoto } from "react-icons/md";
import "./ProfileCard.scss";
import { fetchMyRank } from "../../api/ranking";
import { logout } from "../../api/auth";

function ProfileCard({
  nickname: nicknameProp,
  profileImageUrl: profileImageUrlProp,
  totalPoints: totalPointsProp,
  onChangePhoto,
  title, // New title prop
}) {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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

  // me + my-ranking 불러오기
  useEffect(() => {
    // 부모가 닉네임, 프로필, 포인트를 모두 내려주면 API 호출 생략
    if (nicknameProp && profileImageUrlProp && totalPointsProp) return;

    let alive = true;
    const myReq = ++reqIdRef.current;

    (async () => {
      try {
        setLoading(true);
        setLoadErr(null);

        // 내 랭킹 정보 조회 (user, rank, totalScore 포함)
        const myRankData = await fetchMyRank();
        if (!alive || myReq !== reqIdRef.current) return;

        setMe(myRankData?.user ?? null);
        setRank(myRankData?.rank ?? null);
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("An error occurred during logout:", error);
    } finally {
      navigate("/login");
    }
  };

  const pointsText =
    typeof totalPoints === "number"
      ? totalPoints.toLocaleString()
      : totalPoints ?? 0;

  const rankText =
    Number.isFinite(rank) ? `#${Number(rank).toLocaleString()}` : "-";

  return (
      <div className="profile-card">
        <div className="profile-header">{title || "내 프로필"}</div>

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

          <button type="button" className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
  );
}

export default ProfileCard;

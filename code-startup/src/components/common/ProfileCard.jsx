// src/components/profile/ProfileCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { MdAddAPhoto } from "react-icons/md";
import "./ProfileCard.scss";
import { fetchCurrentUser } from "../../api/user";
import { ensureAccessToken } from "../../api/http";

function ProfileCard({
  nickname: nicknameProp,
  profileImageUrl: profileImageUrlProp,
  totalPoints: totalPointsProp,
  onChangePhoto,
}) {
  const fileInputRef = useRef(null);

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
   const reqIdRef = useRef(0); // 최신 요청만 반영

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

  // me 불러오기
  useEffect(() => {
    // 부모가 모두 내려주면 API 호출 생략
    const hasAllProps =
      nicknameProp != null &&
      profileImageUrlProp != null &&
      totalPointsProp != null;
    if (hasAllProps) return;

    let alive = true;
    const myReq = ++reqIdRef.current;

    (async () => {
      try {
        setLoading(true);
        setLoadErr(null);
       await ensureAccessToken();
        const data = await fetchCurrentUser(); // 내부에서도 한 번 더 보장 & http 인스턴스 사용
        if (!alive || myReq !== reqIdRef.current) return;
        setMe(data ?? null);
      } catch (e) {
        if (!alive || myReq !== reqIdRef.current) return;
        // ❗ 오류가 나도 기존 me는 유지 (UI가 기본값으로 내려앉지 않게)
        setLoadErr(e?.response?.data || e?.message || "사용자 정보를 불러오지 못했습니다.");
      } finally {
        if (alive && myReq === reqIdRef.current) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // props로 값이 채워지면 호출 안 하므로 의존성은 그 셋만
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

  return (
    <aside className="profile-pane">
      <div className="profile-card">
        <div className="profile-header">내 프로필</div>

        <div className="profile-body">
          <div className="two_content top">
            <div className="avatar-wrap">
              <img className="profile-image" src={avatarUrl || fallbackSvgDataUrl} alt="프로필" />
              <button type="button" className="edit-photo-btn" onClick={handleClickEdit} aria-label="프로필 사진 변경" title="프로필 사진 변경">
                <MdAddAPhoto size={18} />
              </button>
              <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="profile-nickname">
              {loading ? (
                <span className="nickname">불러오는 중...</span>
              ) : (
                <>
                  <span className="nickname">{nickname}</span>님
                </>
              )}
            </div>
          </div>

          <div className="two_content points">
            <div className="points-label">Up 포인트</div>
            <div className="points-value">{pointsText} points</div>
          </div>

          {loadErr && (
            <div className="profile-error" role="alert">
              {String(loadErr)}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default ProfileCard;



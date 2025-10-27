// src/components/profile/ProfileCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { MdAddAPhoto } from "react-icons/md";
import "./ProfileCard.scss";
import { fetchCurrentUser } from "../../api/user";

/**
 * ProfileCard
 * - 최초 렌더 시 /api/users/me 호출로 사용자 정보 로딩
 * - 부모가 nickname/profileImageUrl/totalPoints를 넘기면 그 값을 우선 사용
 * - 프로필 사진 변경 클릭 시 파일 선택창 오픈(onChangePhoto 콜백 전달)
 */
const ProfileCard = ({
  nickname: nicknameProp,
  profileImageUrl: profileImageUrlProp,
  totalPoints: totalPointsProp,
  onChangePhoto,
}) => {
  const fileInputRef = useRef(null);

  // 내부 상태 (API에서 못 받아오면 null 유지)
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState(null);

  // props가 있으면 우선 사용, 없으면 API 응답 사용
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

  // 기본 placeholder (프로필 이미지 미지정 시)
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
    // 이미 부모가 모두 내려줬다면 API 호출 생략
    const hasAllProps =
      nicknameProp != null &&
      profileImageUrlProp != null &&
      totalPointsProp != null;

    if (hasAllProps) return;

    // accessToken 없으면 호출 안 함 (초기 화면에서 불필요한 401 방지)
    const at = localStorage.getItem("accessToken") || "";
    if (!at) {
      setMe(null);
      setLoadErr(null);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadErr(null);
        const data = await fetchCurrentUser(); // http 인스턴스 사용
        if (!alive) return;
        setMe(data ?? null);
      } catch (e) {
        if (!alive) return;
        // 401도 여기로 들어오지만, http 인터셉터가 리프레시/재시도를 시도함
        // 그래도 실패하면 메시지 표시
        setLoadErr(e?.response?.data || e?.message || "사용자 정보를 불러오지 못했습니다.");
        setMe(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nicknameProp, profileImageUrlProp, totalPointsProp]);

  const handleClickEdit = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChangePhoto?.(file);
    e.target.value = ""; // 같은 파일 재선택 허용
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
              <img
                className="profile-image"
                src={avatarUrl || fallbackSvgDataUrl}
                alt="프로필"
              />
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
};

export default ProfileCard;


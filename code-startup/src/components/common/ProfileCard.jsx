import { useRef } from "react";
import { MdAddAPhoto } from "react-icons/md";
import "./ProfileCard.scss";

/**
 * ProfileCard
 * - 프로필 사진 우하단 카메라 아이콘 클릭 → 파일선택창
 */
const ProfileCard = ({ nickname, profileImageUrl, totalPoints, onChangePhoto }) => {
  const fileInputRef = useRef(null);

  const handleClickEdit = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChangePhoto?.(file);
    e.target.value = ""; // 같은 파일 재선택 허용
  };

  return (
    <aside className="profile-pane">
      <div className="profile-card">
        <div className="profile-header">내 프로필</div>

        <div className="profile-body">
          <div>프로필 사진 변경</div>
          <div className="two_content top">
            <div className="avatar-wrap">
              <img
                className="profile-image"
                src={
                  profileImageUrl ||
                  "data:image/svg+xml;utf8," +
                    encodeURIComponent(`
                      <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
                        <rect width='100%' height='100%' fill='#f2f4f6'/>
                        <circle cx='100' cy='80' r='40' fill='#d9dee3'/>
                        <rect x='45' y='130' width='110' height='40' rx='20' fill='#d9dee3'/>
                      </svg>
                    `)
                }
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
                <span className="nickname">{nickname}</span>님
            </div>
          </div>
          <div className="two_content points">
              <div className="points-label">Up 포인트</div>{" "}
              <div className="points-value">{totalPoints?.toLocaleString?.() ?? totalPoints}points</div>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default ProfileCard;

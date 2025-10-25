import { useEffect, useState } from "react";
import { fetchMe } from "../../api/auth"; // 모의/실서버 자동 전환 래퍼
import "./UserCard.scss";

const DEFAULT_AVATAR = "/img/default_profile.jpg";

const UserCard = () => {
  const [user, setUser] = useState({
    nickname: "닉네임",
    profileImageUrl: DEFAULT_AVATAR,
    totalPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await fetchMe(); // { username, nickname, profileImageUrl, totalPoints, ... }
        if (!alive) return;
        setUser({
          nickname: me?.nickname ?? "닉네임",
          profileImageUrl: me?.profileImageUrl || DEFAULT_AVATAR,
          totalPoints: Number.isFinite(me?.totalPoints) ? me.totalPoints : 0,
        });
      } catch (e){
        if (alive) setError("유저 정보를 불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const onImgError = (e) => {
    if (e?.target?.src !== window.location.origin + DEFAULT_AVATAR) {
      e.target.src = DEFAULT_AVATAR;
    }
  };

  const pointsText = `${user.totalPoints} points`;

  return (
    <div className="card user-card">
      <div className="card_profile">
        <img src={user.profileImageUrl || DEFAULT_AVATAR} alt="프로필" onError={onImgError} />
        <p>{loading ? "로딩 중..." : `'${user.nickname}'님`}</p>
      </div>
      <div className="card-footer">
        <span>보유 Up 포인트 : {loading ? "…" : pointsText}</span>
      </div>
    </div>
  );
};

export default UserCard;

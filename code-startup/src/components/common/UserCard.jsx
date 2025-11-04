// src/components/common/UserCard.jsx
import { useEffect, useState } from "react";
import { fetchMe } from "../../api/auth";
import { fetchMyRank } from "../../api/ranking";
import SecureAvatar from "./SecureAvatar";
import "./UserCard.scss";

const UserCard = () => {
  const [user, setUser] = useState({
    id: undefined,
    username: "",
    nickname: "닉네임",
    profileImageUrl: "",
    points: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [me, myRank] = await Promise.all([
          fetchMe(),
          fetchMyRank().catch(() => null),
        ]);
        if (!alive) return;
        setUser({
          id: me?.id,
          username: me?.username ?? "",
          nickname: me?.nickname ?? "닉네임",
          profileImageUrl: me?.profileImageUrl ?? "",
          points: myRank?.points ?? 0,
        });
      } catch {
        if (alive) setError("유저 정보를 불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const pointsText = `${user.points} points`;

  return (
    <div className="card user-card" aria-busy={loading}>
      <div className="card_profile">
        <SecureAvatar
          size={100}
          className="avatar"
          circle={false}
          candidates={[
            user.profileImageUrl,                       // 서버 제공값(상대/절대 무엇이든)
            user.id && `/files/profile/${user.id}.jpg`,
            user.id && `/files/profile/${user.id}.png`,
            user.username && `/files/profile/${user.username}.jpg`,
            user.username && `/files/profile/${user.username}.png`,
            `https://api.dicebear.com/9.x/identicon/svg?seed=${
              encodeURIComponent(user.nickname || user.username || `User#${user.id ?? ""}`)
            }`,
            "/img/default_profile.jpg",                 // 최종 폴백 (SecureAvatar 내부에도 있지만 명시)
          ].filter(Boolean)}
        />

        <div className="text-wrap">
          <p className="nickname">{loading ? "로딩 중..." : `'${user.nickname}'님`}</p>
          {error ? <span className="err">{error}</span> : null}
        </div>
      </div>

      <div className="card-footer">
        <span>보유 Up 포인트 : {loading ? "…" : pointsText}</span>
      </div>
    </div>
  );
};

export default UserCard;

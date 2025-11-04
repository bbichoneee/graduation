//2. 메인 페이지
import { useEffect, useState, useMemo } from "react";
import MenuBar from "../../components/common/MenuBar";
import { fetchCurrentUser } from "../../api/user";
import { fetchMyRank } from "../../api/ranking"; // Import fetchMyRank
import './Car.scss';

const Home = () => {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  // 숫자 포맷터 (UP 포인트 1,234 처럼)
  const nf = useMemo(() => new Intl.NumberFormat(), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [userData, myRankData] = await Promise.all([
          fetchCurrentUser(),
          fetchMyRank().catch(() => null), // Fetch my rank, handle error gracefully
        ]);
        if (!mounted) return;

        setMe({
          ...userData,
          points: myRankData?.points ?? 0, // Add points from ranking data
        });
      } catch (e) {
        if (!mounted) return;
        setLoadErr(e);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const avatarSrc = me?.profileImageUrl || "/img/default-avatar.png";
  const displayName = me?.nickname || me?.username || "사용자";
  const points = typeof me?.points === "number" ? nf.format(me.points) : "0";

  return (
    <div>
      <MenuBar/>

      {/* ✅ 사용자 정보 리본 */}
      <div className="user_item" role="region" aria-label="사용자 정보">
        {loading ? (
          <div className="user_ribbon">
            <div className="user_ribbon__skeleton avatar" />
            <div className="user_ribbon__skeleton name" />
            <div className="user_ribbon__skeleton points" />
          </div>
        ) : loadErr ? (
          <div className="user_ribbon">
            <span className="user_ribbon__error">사용자 정보를 불러오지 못했습니다.</span>
          </div>
        ) : me ? (
          <div className="user_ribbon">
            <img
              className="user_ribbon__avatar"
              src={avatarSrc}
              alt={`${displayName} 프로필 이미지`}
              referrerPolicy="no-referrer"
            />
            <span className="user_ribbon__name">'{displayName}'님</span>
            <span className="user_ribbon__divider" aria-hidden>│</span>
            <span className="user_ribbon__points" title="보유 UP 포인트">
              보유 UP 포인트 : &nbsp;<strong>{points}</strong> &nbsp;points
            </span>
          </div>
        ) : (
          <div className="user_ribbon">
            <span className="user_ribbon__guest">로그인이 필요합니다</span>
          </div>
        )}
      </div>

      {/* 히어로 캐러셀 */}
      <div
        id="heroCarousel"
        className="carousel slide carousel-80vh"
        data-bs-ride="carousel"
        data-bs-interval="3000"    // 3초 간격
        data-bs-wrap="true"        // 끝->처음 순환
      >
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src="/img/carousel1.png" className="d-block w-100" alt="..." />
          </div>
          <div className="carousel-item">
            <img src="/img/carousel2.png" className="d-block w-100" alt="..." />
          </div>
          <div className="carousel-item">
            <img src="/img/carousel3.png" className="d-block w-100" alt="..." />
          </div>
        </div>

        <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </div>
  );
};

export default Home;

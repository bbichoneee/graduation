// src/utils/resolveImageUrl.js
const DEFAULT_AVATAR = "/img/default_profile.jpg";

export function withBase(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const base =
    import.meta.env.VITE_FILE_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";
  if (!base) return url.startsWith("/") ? url : `/${url}`;
  const sep = base.endsWith("/") ? "" : "/";
  const path = url.startsWith("/") ? url.slice(1) : url;
  return `${base}${sep}${path}`;
}

/**
 * 사용자 정보( id, username, nickname )를 기반으로
 * "가능성 높은 아바타 경로"들을 우선순위대로 생성한다.
 * 백엔드 경로 패턴이 확정되지 않았으므로 여러 패턴을 시도한다.
 */
export function buildAvatarCandidates(user, serverUrlFromMe) {
  const urls = [];
  const push = (u) => u && urls.push(u);

  // 1) 서버가 내려준 URL 그대로(절대/상대 모두 지원)
  push(serverUrlFromMe);

  // 2) 가능한 파일 경로 패턴들 (id/username 기반 추정)
  const id = user?.id;
  const username = user?.username;
  const guess = (p) => withBase(p);

  if (id) {
    push(guess(`/files/profile/${id}.jpg`));
    push(guess(`/files/profile/${id}.png`));
    push(guess(`/files/profile/profile_${id}.jpg`));
    push(guess(`/files/profile/profile_${id}.png`));
  }
  if (username) {
    push(guess(`/files/profile/${username}.jpg`));
    push(guess(`/files/profile/${username}.png`));
  }

  // 3) 아이덴티콘
  const seed = user?.nickname || username || `User#${id ?? ""}`;
  push(`https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}`);

  // 4) 최종 디폴트
  push(DEFAULT_AVATAR);

  // 중복 제거
  return [...new Set(urls)];
}

export const DEFAULT_PROFILE_AVATAR = DEFAULT_AVATAR;

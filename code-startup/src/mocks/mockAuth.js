// 아주 단순한 localStorage 기반 모의 백엔드
const DB_KEY = "mock_users";
const RT_KEY = "mock_refresh_tokens"; // { refreshToken: username }
const TOKEN_PREFIX = "mock.";
const ACCESS_TTL_MS = 30 * 60 * 1000; // 30분

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || "[]"); } catch { return []; }
}
function saveUsers(arr) { localStorage.setItem(DB_KEY, JSON.stringify(arr)); }

function loadRT() {
  try { return JSON.parse(localStorage.getItem(RT_KEY) || "{}"); } catch { return {}; }
}
function saveRT(obj) { localStorage.setItem(RT_KEY, JSON.stringify(obj)); }

function now() { return Date.now(); }
function makeAccess(username) {
  const payload = { sub: username, exp: now() + ACCESS_TTL_MS };
  return TOKEN_PREFIX + btoa(JSON.stringify(payload));
}
function parseAccess(token) {
  if (!token?.startsWith(TOKEN_PREFIX)) throw new Error("invalid token");
  const json = atob(token.slice(TOKEN_PREFIX.length));
  return JSON.parse(json); // { sub, exp }
}

export async function mockSignup({ username, password, nickname, profileImageUrl }) {
  const users = loadUsers();
  if (users.some(u => u.username === username)) {
    const e = new Error("이미 사용 중인 아이디입니다.");
    e.status = 409;
    throw e;
  }
  users.push({ username, password, nickname, profileImageUrl });
  saveUsers(users);
  return { ok: true };
}

export async function mockLogin({ username, password }) {
  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) { const e = new Error("로그인 실패"); e.status = 401; throw e; }

  const accessToken = makeAccess(username);
  const refreshToken = crypto.getRandomValues(new Uint32Array(8)).join("");
  const rtMap = loadRT();
  // 단일 RT 정책: 기존 토큰 제거
  Object.keys(rtMap).forEach(rt => { if (rtMap[rt] === username) delete rtMap[rt]; });
  rtMap[refreshToken] = username;
  saveRT(rtMap);

  return { accessToken, refreshToken, tokenType: "Bearer" };
}

export async function mockRefresh(refreshToken) {
  const rtMap = loadRT();
  const username = rtMap[refreshToken];
  if (!username) { const e = new Error("리프레시 토큰 없음"); e.status = 401; throw e; }

  // 회전
  delete rtMap[refreshToken];
  const newRT = crypto.getRandomValues(new Uint32Array(8)).join("");
  rtMap[newRT] = username;
  saveRT(rtMap);

  const accessToken = makeAccess(username);
  return { accessToken, refreshToken: newRT, tokenType: "Bearer" };
}

export async function mockMe(accessToken) {
  const { sub, exp } = parseAccess(accessToken);
  if (exp < now()) { const e = new Error("만료됨"); e.status = 401; throw e; }

  const users = loadUsers();
  const user = users.find(u => u.username === sub);
  if (!user) { const e = new Error("사용자 없음"); e.status = 404; throw e; }

  // 백엔드 /api/auth/me 응답 형태 최소화
  return {
    id: 0,
    username: user.username,
    nickname: user.nickname,
    profileImageUrl: user.profileImageUrl || "/img/default_profile.png",
    totalPoints: 0,
    level: 1,
  };
}

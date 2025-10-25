// src/lib/dailyProgress.js
const SOLVED_KEY = "csu_daily_solved_map"; // { 'YYYY-MM-DD': { id, solved: true } }
const PROGRESS_EVT = "csu:daily-progress";
const POINTS_KEY = "mock_user_points"; // MSW /auth/me가 이 값을 반환하도록 핸들러에서 사용

// 오늘 날짜키 (로컬 시간 기준)
export function getTodayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadMap() {
  try { return JSON.parse(localStorage.getItem(SOLVED_KEY) || "{}"); }
  catch { return {}; }
}
function saveMap(obj) { localStorage.setItem(SOLVED_KEY, JSON.stringify(obj)); }

function dispatchProgressEvent() {
  window.dispatchEvent(new CustomEvent(PROGRESS_EVT));
}

// 오늘 정답 처리(+ 이벤트)
export function markSolvedToday(problemId) {
  const key = getTodayKey();
  const map = loadMap();
  map[key] = { id: Number(problemId), solved: true };
  saveMap(map);
  dispatchProgressEvent();
}

// 오늘 풀었는지
export function isSolvedToday() {
  const key = getTodayKey();
  const map = loadMap();
  return !!map[key]?.solved;
}

// 지금까지 “정답한 날짜 수” (오늘 포함)
function countCompletedDays() {
  const map = loadMap();
  return Object.values(map).filter(v => v?.solved).length;
}

// 기준 ID(예: 1) + “정답 완료한 일수” 만큼 진도 상승
export function getCurrentDailyId(baseId = 1) {
  return Number(baseId) + countCompletedDays();
}

// 내일 표시용 미리보기 ID
export function getNextDailyIdPreview(baseId = 1) {
  const cur = getCurrentDailyId(baseId);
  return cur + (isSolvedToday() ? 1 : 0);
}

// 진행도 변경 이벤트 리스너
export function onDailyProgressChange(listener) {
  window.addEventListener(PROGRESS_EVT, listener);
  return () => window.removeEventListener(PROGRESS_EVT, listener);
}

// ---- Up 포인트 로컬 관리 (MSW /auth/me에서 반영) ----
export function setUserPoints(points) {
  localStorage.setItem(POINTS_KEY, String(Number(points) || 0));
  // 포인트 바뀌면 UserCard가 /auth/me를 다시 읽을 수도 있으니 이벤트도 던져줌
  dispatchProgressEvent();
}
export function getUserPoints() {
  return Number(localStorage.getItem(POINTS_KEY) || "0");
}

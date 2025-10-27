// src/api/problems.js
import { http } from "./http";

/** 문제 목록 */
export async function fetchProblems() {
  const res = await http.get("/api/problems");
  return res.data;
}

/** 문제 상세 */
export async function fetchProblemById(id) {
  const res = await http.get(`/api/problems/${id}`);
  return res.data;
}

/** (옵션) 문제 통계
 * - 백엔드에 /api/problems/{id}/stats가 없거나 보호되어 401/404가 나면
 *   기본값을 반환해 UI가 깨지지 않도록 함.
 * - .env에 VITE_USE_STATS_API=0 이면 호출 자체를 생략.
 *
 * 기본 반환 형태:
 *   { solved: number, attempts: number, rate: number|null, available: boolean }
 */
const USE_STATS = import.meta.env.VITE_USE_STATS_API !== "0";

export async function fetchProblemStats(id) {
  if (!USE_STATS) {
    return { solved: 0, attempts: 0, rate: null, available: false };
  }

  try {
    const res = await http.get(`/api/problems/${id}/stats`);
    // 서버가 어떤 형태로 주든 최소 필드 보정
    const data = res.data ?? {};
    const solved = Number(data.solved ?? 0);
    const attempts = Number(data.attempts ?? 0);
    const rate =
      typeof data.rate === "number"
        ? data.rate
        : attempts > 0
        ? solved / attempts
        : null;

    return { solved, attempts, rate, available: true };
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401 || status === 404) {
      // 구현 전이거나 보안 포워드로 401이 떨어지는 케이스 → 안전한 기본값
      return { solved: 0, attempts: 0, rate: null, available: false };
    }
    // 다른 에러는 상위에서 처리할 수 있게 그대로 throw
    throw err;
  }
}

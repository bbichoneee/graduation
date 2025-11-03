// src/api/problems.js
import { http } from "./http";

/* ---------- helpers ---------- */
const parseTestCases = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {}
  }
  return [];
};

const adaptProblem = (raw) => {
  const testCases = parseTestCases(raw?.testCases ?? raw?.testCasesJson ?? '[]');

  return {
    id: raw.id,
    orderNum: raw.orderNum, // Add orderNum for display
    title: raw.title,
    description: raw.description,
    input: raw.input || '입력 정보가 없습니다.', // Use direct field from API
    output: raw.output || '출력 정보가 없습니다.', // Use direct field from API
    level: (raw.level && raw.level > 0) ? raw.level : 1,
    uppoint: raw.uppoint ?? 0,
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : ["기타"],
    testCases,
    _raw: raw,
  };
};

/* ---------- API ---------- */
export async function fetchProblems() {
  const { data } = await http.get("/api/problems");
  const rows = Array.isArray(data) ? data : [];
  return rows.map(adaptProblem);
}

export async function fetchProblemByOrderNum(orderNum) {
  const { data } = await http.get(`/api/problems/${orderNum}`);
  return adaptProblem(data);
}

/* ---------- (옵션) 통계 ---------- */
const USE_STATS = import.meta.env.VITE_USE_STATS_API !== "0";
export async function fetchProblemStats(orderNum) {
  if (!USE_STATS) return { solved: 0, attempts: 0, rate: null, available: false };
  try {
    const { data } = await http.get(`/api/problems/${orderNum}/stats`);
    const solved = Number(data?.solved ?? 0);
    const attempts = Number(data?.attempts ?? 0);
    const rate = typeof data?.rate === "number" ? data.rate : (attempts > 0 ? solved / attempts : null);
    return { solved, attempts, rate, available: true };
  } catch (err) {
    const st = err?.response?.status;
    if (st === 401 || st === 404) return { solved: 0, attempts: 0, rate: null, available: false };
    throw err;
  }
}

/**
 * 오늘의 문제 조회 (/api/daily/today)
 */
export async function fetchDailyProblem() {
  const { data } = await http.get("/api/daily/today");
  return data; // Returns DailyProblemResponse
}


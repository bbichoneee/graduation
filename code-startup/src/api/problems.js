// src/api/problems.js
import { http } from "./http";

/* ---------- helpers ---------- */
const mapDifficultyToLevel = (d) => {
  if (!d) return null;
  const m = String(d).toUpperCase().match(/(\d+)/);
  return m ? Number(m[1]) : null;
};

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

// testCases 기반으로 input/output 설명 유추
const deriveInputOutputFromTestCases = (testCases) => {
  const hasAnyInput = testCases.some(tc => (tc?.inputData ?? "").trim().length > 0);
  const input = hasAnyInput ? "예제를 참고하세요." : "입력은 없다.";
  const output = "예제를 참고하세요.";
  return { input, output };
};

const adaptProblem = (raw) => {
  const tcRaw = raw?.testCasesJson ?? raw?.testCases;
  const testCases = parseTestCases(tcRaw).map((tc) => ({
    inputData: tc?.inputData ?? "",
    expectedOutput: tc?.expectedOutput ?? "",
    isSample: !!tc?.isSample,
  }));

  const { input, output } = deriveInputOutputFromTestCases(testCases);

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,

    // 서버에 없으므로 testCases로 유추
    input,
    output,

    level: mapDifficultyToLevel(raw?.difficulty),
    // score가 0으로 내려오면 화면엔 '-'로 보이도록 null 처리(선택)
    uppoint: raw?.score && raw.score > 0 ? raw.score : null,

    testCases,
    // 서버에 tags가 없으면 기본값
    tags: Array.isArray(raw?.tags) ? raw.tags : ["기타"],

    _raw: raw,
  };
};

/* ---------- API ---------- */
export async function fetchProblems() {
  const { data } = await http.get("/api/problems");
  const rows = Array.isArray(data) ? data : [];
  return rows.map(adaptProblem);
}

export async function fetchProblemById(id) {
  const { data } = await http.get(`/api/problems/${id}`);
  return adaptProblem(data);
}

/* ---------- (옵션) 통계 ---------- */
const USE_STATS = import.meta.env.VITE_USE_STATS_API !== "0";
export async function fetchProblemStats(id) {
  if (!USE_STATS) return { solved: 0, attempts: 0, rate: null, available: false };
  try {
    const { data } = await http.get(`/api/problems/${id}/stats`);
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

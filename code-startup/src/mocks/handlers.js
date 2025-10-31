// src/mocks/handlers.js
import { http, HttpResponse, delay } from "msw";
import problems from "../data/problems.json";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";
const passthrough = () => HttpResponse.passthrough();

const mockProblems = Array.isArray(problems) ? problems : (problems?.problems ?? []);
const findProblemById = (id) => mockProblems.find(p => Number(p.id) === Number(id));

/* ===================== 공통 유틸 ===================== */

/** 간단 컴파일 오류 휴리스틱 */
function detectCompileError(code = "") {
  const src = String(code);

  // 필수 include / main 존재 체크(필요에 따라 완화 가능)
  if (!/#include\s*<stdio\.h>/.test(src)) return "missing <stdio.h>";
  if (!/int\s+main\s*\(\s*void\s*\)/.test(src)) return "invalid main signature";

  // 괄호 밸런스
  const stack = [];
  for (const ch of src) {
    if ("([{".includes(ch)) stack.push(ch);
    else if (")]}".includes(ch)) {
      const last = stack.pop();
      if (!last || "([{".indexOf(last) !== ")]}".indexOf(ch)) return "unbalanced brackets";
    }
  }
  if (stack.length) return "unbalanced brackets";

  // 아주 기초적인 세미콜론 체크
  const lines = src.split(/\r?\n/).map(l => l.trim());
  for (const ln of lines) {
    if (!ln || ln.startsWith("//") || ln.endsWith("{") || ln.endsWith(":") || ln.endsWith("}")) continue;
    if (/^#/.test(ln)) continue; // 전처리기
    if (/^(if|for|while|switch)\b/.test(ln)) continue;
    if (/\)\s*\{?$/.test(ln)) continue; // 함수 선언 라인

    if (!ln.endsWith(";")) return "missing semicolon";
  }
  return null;
}

/** C 문자열 이스케이프 해제 */
function unescapeCString(s) {
  return String(s)
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

/** printf("..."); 들의 리터럴을 추출해 이어붙여 가상 출력 생성 (변수/포맷 미지원) */
function simulatePrintfOutput(code = "") {
  const re = /printf\s*\(\s*"((?:\\.|[^"\\])*)"\s*\)\s*;/g;
  const out = [];
  let m;
  while ((m = re.exec(code)) !== null) {
    out.push(unescapeCString(m[1]));
  }
  return out.join("");
}

/** 완전 동일 비교용 정규화 */
function norm(s) {
  return String(s ?? "");
}

/** 결정적 판정: OK/WA/CE 반환 */
function isCorrectMock(problem, code) {
  // 1) 컴파일 오류 우선
  const ce = detectCompileError(code);
  if (ce) return { type: "CE", reason: ce };

  const tcs = Array.isArray(problem?.testCases) ? problem.testCases : [];
  if (tcs.length === 0) return { type: "OK" }; // 케이스 없으면 통과(정책에 따라 변경 가능)

  // 2) 코드로부터 가상 출력 생성
  const simulated = simulatePrintfOutput(code);

  // 3) 모든 테스트케이스의 expectedOutput과 "완전 동일"해야 통과
  const ok = tcs.every(tc => norm(simulated) === norm(tc?.expectedOutput));
  return ok ? { type: "OK" } : { type: "WA" };
}

/* ===================== 제출 공용 resolver ===================== */

async function submissionResolver({ request }) {
  if (!USE_MOCK) return HttpResponse.passthrough();

  // 1) 요청 바디 파싱
  const body = await request.json();
  const {
    problemId,
    code,
    language = "c",
    usedMs,
    sharePublic,
    testCases = [],
  } = body;

  // 2) 문제 찾기(없으면 body의 testCases로 대체)
  const p = findProblemById(problemId) || { testCases };

  // 3) 판정 실행
  const judge = isCorrectMock(p, code);  // { type: 'OK' | 'WA' | 'CE', reason? }
  let result = "FAIL";
  if (judge.type === "OK") result = "SUCCESS";
  if (judge.type === "CE") result = "COMPILE_ERROR";

  // 4) 통계 갱신 (문제별)
  const key = `mock:stats:${problemId}`;
  const s = JSON.parse(localStorage.getItem(key) || '{"attempts":0,"solved":0}');
  s.attempts += 1;
  if (result === "SUCCESS") s.solved += 1;
  localStorage.setItem(key, JSON.stringify(s));

  // 5) 데모용 리소스/시간 값 (성공일 때만 임의 부여)
  const execMs = result === "SUCCESS" ? Math.floor(10 + Math.random() * 30) : 0;
  const memKb  = result === "SUCCESS" ? Math.floor(200 + Math.random() * 100) : 0;

  await delay(250);
  return HttpResponse.json({
    id: crypto.randomUUID(),
    result,
    language,
    executionTimeMs: execMs,
    memoryUsageKb: memKb,
    usedMs: usedMs ?? null,
    sharePublic: !!sharePublic,
    cases: (p.testCases || []).map((tc, i) => ({
      idx: i,
      status:
        result === "SUCCESS"
          ? "Accepted"
          : (judge.type === "CE" ? "Compilation Error" : "Wrong Answer"),
      timeMs: execMs,
      memoryKb: memKb,
    })),
    stats: s,
  });
}

/* ===========================================================
   ===== 여기부터 랭킹/유저/제출(목록) 목업 추가 =====
   =========================================================== */

const mockUsers = [
  { id: 1, username: "alice",  nickname: "앨리스",  profileImageUrl: "/img/sample1.jpg" },
  { id: 2, username: "bruce",  nickname: "브루스",  profileImageUrl: "/img/sample2.jpg" },
  { id: 3, username: "charly", nickname: "찰리",   profileImageUrl: "/img/sample3.jpg" },
  { id: 4, username: "diana",  nickname: "다이애나" },
];
const currentUserId = 2;

const mockRanking = [
  { id: 101, user: mockUsers[1], totalScore: 3500 },
  { id: 102, user: mockUsers[0], totalScore: 3200 },
  { id: 103, user: mockUsers[2], totalScore: 2800 },
  { id: 104, user: mockUsers[3], totalScore: 1200 },
];

const submissionsByUser = {
  1: [
    { id: "a1", problemId: 11, problemTitle: "실수의 정수 변환", points: 10, result: "AC",      submittedAt: "2025-10-01T10:10:00Z" },
    { id: "a2", problemId: 12, problemTitle: "문자열 뒤집기",     points: 20, result: "WA",      submittedAt: "2025-10-02T09:00:00Z" },
    { id: "a3", problemId: 12, problemTitle: "문자열 뒤집기",     points: 20, result: "SUCCESS", submittedAt: "2025-10-02T09:10:00Z" },
  ],
  2: [
    { id: "b1", problemId: 1,  problemTitle: "Hello CSU!",       points: 5,  result: "AC", submittedAt: "2025-10-03T12:00:00Z" },
    { id: "b2", problemId: 21, problemTitle: "약수 구하기",       points: 15, result: "WA", submittedAt: "2025-10-05T14:30:00Z" },
  ],
  3: [
    { id: "c1", problemId: 7,  problemTitle: "소수 판별",         points: 15, result: "WA", submittedAt: "2025-10-06T08:00:00Z" },
  ],
  4: [],
};

function calcStats(list) {
  const solvedCount  = list.length;
  const correctCount = list.filter(r => (r.result || "").toUpperCase() === "AC" || r.result === "SUCCESS").length;
  const wrongCount   = solvedCount - correctCount;
  return { solvedCount, correctCount, wrongCount };
}

function getQuery(req, key) {
  const url = new URL(req.url);
  return url.searchParams.get(key);
}

function filterByResult(list, result) {
  const upper = (result || "").toUpperCase();
  if (!upper || upper === "ALL") return list;
  if (upper === "AC" || upper === "SUCCESS") {
    return list.filter(r => (r.result || "").toUpperCase() === "AC" || r.result === "SUCCESS");
  }
  if (upper === "WA") {
    return list.filter(r => (r.result || "").toUpperCase() !== "AC" && r.result !== "SUCCESS");
  }
  return list;
}

/* ===================== 라우팅 등록 ===================== */

export const handlers = [
  // 문제 단건
  http.get("/api/problems/:id", async ({ params }) => {
    if (!USE_MOCK) return passthrough();
    const p = findProblemById(params.id);
    await delay(120);
    if (!p) return new HttpResponse("Not Found", { status: 404 });
    return HttpResponse.json(p);
  }),

  // 통계
  http.get("/api/problems/:id/stats", async ({ params }) => {
    if (!USE_MOCK) return passthrough();
    const key = `mock:stats:${params.id}`;
    const value = JSON.parse(localStorage.getItem(key) || '{"attempts":0,"solved":0}');
    await delay(120);
    return HttpResponse.json(value);
  }),

  // 제출(단건 채점)
  http.post("/api/submission", submissionResolver),
  http.post("/api/submit",     submissionResolver),

  // ===== 랭킹/유저/제출 목록 API (추가) =====
  // 현재 로그인 유저
  http.get("/api/users/me", async () => {
    if (!USE_MOCK) return passthrough();
    const me = mockUsers.find(u => u.id === currentUserId);
    if (!me) return HttpResponse.json(null, { status: 401 });
    const r = mockRanking.find(r => r.user.id === me.id);
    await delay(120);
    return HttpResponse.json({ ...me, totalPoints: r?.totalScore ?? 0 });
  }),

  // 내 통계
  http.get("/api/users/me/stats", async () => {
    if (!USE_MOCK) return passthrough();
    const list = submissionsByUser[currentUserId] || [];
    await delay(120);
    return HttpResponse.json(calcStats(list));
  }),

  // 특정 유저 통계
  http.get("/api/users/:id/stats", async ({ params }) => {
    if (!USE_MOCK) return passthrough();
    const id = Number(params.id);
    const list = submissionsByUser[id] || [];
    await delay(120);
    return HttpResponse.json(calcStats(list));
  }),

  // 내 제출 히스토리
  http.get("/api/submissions/me", async ({ request }) => {
    if (!USE_MOCK) return passthrough();
    const result = getQuery(request, "result"); // all|ac|wa
    const limit  = Number(getQuery(request, "limit")) || 200;
    const all = submissionsByUser[currentUserId] || [];
    const filtered = filterByResult(all, result).slice(0, limit);
    await delay(120);
    return HttpResponse.json(filtered);
  }),

  // 특정 유저 제출 히스토리
  http.get("/api/submissions", async ({ request }) => {
    if (!USE_MOCK) return passthrough();
    const userId = Number(getQuery(request, "userId"));
    const result = getQuery(request, "result");
    const limit  = Number(getQuery(request, "limit")) || 200;
    const all = submissionsByUser[userId] || [];
    const filtered = filterByResult(all, result).slice(0, limit);
    await delay(120);
    return HttpResponse.json(filtered);
  }),

  // 랭킹
  http.get("/api/ranking", async () => {
    if (!USE_MOCK) return passthrough();
    // totalScore desc 라고 가정
    await delay(120);
    return HttpResponse.json(mockRanking);
  }),
];

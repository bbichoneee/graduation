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

/** 완전 동일 비교용 정규화 (공백/개행 무시) */
function norm(s) {
  return String(s ?? "").trim();
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

// 모의 제출 저장소 (인메모리)
const mockSubmissions = new Map(); // submissionId -> submissionObject

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

  // 3) 초기 제출 객체 생성 (PENDING 상태)
  const newSubmission = {
    id: crypto.randomUUID(),
    problemId,
    code,
    language,
    usedMs,
    sharePublic,
    result: "PENDING", // Initial status
    executionTimeMs: 0,
    memoryUsageKb: 0,
    cases: [],
    submittedAt: new Date().toISOString(),
  };
  mockSubmissions.set(newSubmission.id, newSubmission);

  await delay(100); // Simulate network latency for initial submission
  return HttpResponse.json(newSubmission);
}

// 제출 결과 폴링 핸들러
async function fetchSubmissionResultMock({ params }) {
  if (!USE_MOCK) return HttpResponse.passthrough();

  const submissionId = params.id;
  let submission = mockSubmissions.get(submissionId);

  if (!submission) {
    return new HttpResponse("Not Found", { status: 404 });
  }

  // Simulate judging process
  if (submission.result === "PENDING" || submission.result === "JUDGING") {
    await delay(1000 + Math.random() * 1000); // Simulate judging time (1-2 seconds)

    // Perform actual mock judging
    const p = findProblemById(submission.problemId) || { testCases: submission.testCases };
    const judge = isCorrectMock(p, submission.code);

    let result = "FAIL";
    if (judge.type === "OK") result = "SUCCESS";
    if (judge.type === "CE") result = "COMPILE_ERROR";

    const execMs = result === "SUCCESS" ? Math.floor(10 + Math.random() * 30) : 0;
    const memKb  = result === "SUCCESS" ? Math.floor(200 + Math.random() * 100) : 0;

    submission = {
      ...submission,
      result,
      executionTimeMs: execMs,
      memoryUsageKb: memKb,
      cases: (p.testCases || []).map((tc, i) => ({
        idx: i,
        status:
          result === "SUCCESS"
            ? "Accepted"
            : (judge.type === "CE" ? "Compilation Error" : "Wrong Answer"),
        timeMs: execMs,
        memoryKb: memKb,
      })),
    };
    mockSubmissions.set(submissionId, submission);

    // Update problem stats (optional, as in original submissionResolver)
    const key = `mock:stats:${submission.problemId}`;
    const s = JSON.parse(localStorage.getItem(key) || '{"attempts":0,"solved":0}');
    s.attempts += 1;
    if (result === "SUCCESS") s.solved += 1;
    localStorage.setItem(key, JSON.stringify(s));
  }

  return HttpResponse.json(submission);
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

  // 특정 유저 정보
  http.get("/api/users/:id", async ({ params }) => {
    if (!USE_MOCK) return passthrough();
    const user = mockUsers.find(u => u.id === Number(params.id));
    if (!user) return new HttpResponse("Not Found", { status: 404 });
    const r = mockRanking.find(r => r.user.id === user.id);
    await delay(120);
    return HttpResponse.json({ ...user, totalPoints: r?.totalScore ?? 0 });
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
    const responseData = mockRanking.map((r, index) => ({
      rank: index + 1,
      userId: r.user.id,
      nickname: r.user.nickname,
      level: r.user.level || 1, // Assuming default level 1 if not specified in mockUsers
      points: r.totalScore,
      profileImageUrl: r.user.profileImageUrl
    }));
    await delay(120);
    return HttpResponse.json(responseData);
  }),

  http.get("/api/ranking/me", async () => {
    if (!USE_MOCK) return passthrough();
    const me = mockUsers.find(u => u.id === currentUserId);
    const myRank = mockRanking.find(r => r.user.id === currentUserId);
    const myRankIndex = mockRanking.findIndex(r => r.user.id === currentUserId);

    if (!myRank) {
      return HttpResponse.json(null);
    }

    const response = {
      rank: myRankIndex + 1,
      totalScore: myRank.totalScore,
      user: me
    };

    await delay(100);
    return HttpResponse.json(response);
  }),
];

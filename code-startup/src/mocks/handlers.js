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
    if (!ln || ln.startsWith("//") || ln.endsWith("{") || ln.endswith?.(":") || ln.endsWith("}")) continue;
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

/** 완전 동일 비교용 정규화 (여기선 사실상 원문 유지) */
function norm(s) {
  // 필요시 \r\n → \n 통일 등을 넣을 수 있음. 지금은 “완전 동일” 원칙이라 손대지 않음.
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

  // 4) 통계 갱신
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
    // reason: judge.reason || null, // 필요 시 주석 해제해 디버깅 메시지 확인
  });
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

  // 제출
  http.post("/api/submission", submissionResolver),
  http.post("/api/submit",     submissionResolver),
];

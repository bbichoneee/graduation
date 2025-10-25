// src/pages/SolveQ.jsx
import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./SolveQ.scss";
import MenuBar from "../../components/common/MenuBar";
import TimeLimitBadge from "../Qbank/TimeLimitBadge";
import AnswerRate from "../Qbank/AnswerRate";
import useSolveTimer from "../../components/hooks/useSolveTimer";
import CodeEditor from "../../components/utility/CodeEditor";
import { fetchProblemById } from "../../api/problems";
import { submitSolution } from "../../api/submission";
import useProblemStats from "../../components/hooks/useProblemStats";
import { markSolvedToday } from "../../lib/dailyProgress";

export default function SolveQ() {
  const { id } = useParams();
  const pid = Number(id);

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [tab, setTab] = useState("submit"); // submit | others | result
  const [sharePublic, setSharePublic] = useState(false);

  const [submission, setSubmission] = useState(null); // 서버에서 받은 채점 결과
  const { formatted, recordSubmit } = useSolveTimer();

  // ✅ 정답 처리 중복 방지용 플래그
  const solvedMarkedRef = useRef(false);

  const [source, setSource] = useState(
`#include <stdio.h>

int main(void){
    // 여기에 코드를 작성하세요
    return 0;
}
`
  );

  // 문제 로드
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    fetchProblemById(pid)
      .then((data) => { if (alive) setProblem(data); })
      .catch((e) => { if (alive) setLoadError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [pid]);

  // ✅ 정답(SUCCESS) 되자마자 하루 진도 기록 (한 번만)
  useEffect(() => {
    const r = String(submission?.result || "").toUpperCase();
    if (!problem) return;
    if (!solvedMarkedRef.current && r === "SUCCESS") {
      markSolvedToday(problem.id);
      solvedMarkedRef.current = true;
    }
  }, [submission?.result, problem]);

  // 제출(동기 결과 반환) — 언어는 C로 고정
  const handleSubmit = async () => {
    try {
      const usedMs = recordSubmit();
      const created = await submitSolution({
        problemId: pid,
        code: source,
        language: "c", // ✅ 고정
        usedMs,
        sharePublic,
        testCases: problem.testCases,
      });
      setSubmission(created);
      setTab("result");
      // ⚠️ 굳이 여기서 markSolvedToday를 바로 호출하지 않습니다.
      // 위 useEffect가 SUCCESS 전환을 감지해 딱 한 번만 기록합니다.
    } catch (e) {
      alert("제출 실패: " + (e.response?.data?.message || e.message));
    }
  };

  if (loading) return <div className="container py-4"><div className="alert alert-info">문제를 불러오는 중입니다…</div></div>;
  if (loadError) return <div className="container py-4"><div className="alert alert-danger">문제를 불러오지 못했습니다. ({String(loadError)})</div></div>;
  if (!problem) return <div className="container py-4"><div className="alert alert-warning">해당 문제를 찾을 수 없습니다. <Link to="/qbank">문제은행으로 돌아가기</Link></div></div>;

  const execMs  = submission?.executionTimeMs ?? null;
  const memKb   = submission?.memoryUsageKb ?? null;

  const resultLabel = (r) => {
    const key = String(r || "").toUpperCase();
    switch (key) {
      case "SUCCESS": return "정답";
      case "FAIL": return "오답";
      case "COMPILE_ERROR": return "컴파일 오류";
      case "RUNTIME_ERROR": return "런타임 오류";
      case "TIMEOUT": return "시간 초과";
      case "MEMORY_EXCEEDED": return "메모리 초과";
      case "PENDING": return "대기 중";
      case "JUDGING": return "채점 중";
      default: return key || "-";
    }
  };

  // (기존에 있던 statusClass 유지 or 살짝 보강)
  const statusClass = (s) => {
    const up = String(s || "").toUpperCase();
    if (up === "SUCCESS") return "bg-success";
    if (up === "FAIL") return "bg-danger";
    if (up === "COMPILE_ERROR") return "bg-warning text-dark";
    if (up === "RUNTIME_ERROR") return "bg-warning text-dark";
    if (up === "TIMEOUT") return "bg-warning text-dark";
    if (up === "MEMORY_EXCEEDED") return "bg-warning text-dark";
    if (up === "PENDING" || up === "JUDGING") return "bg-info text-dark";
    return "bg-secondary";
  };

  return (
    <div>
      <MenuBar />
      <div className="container py-4">
        <div className="d-flex me-auto align-items-center justify-content-center mb-3 gap-2">
          <Link to="/qbank" className="btn btn-outline-secondary btn-sm">← 문제은행</Link>
        </div>

        <div className="row g-3 mb-3 ">
          {/* 문제 설명 */}
          <div className="col-12">
            <div className="card solve-card">
              <h3 className="m-3">#{problem.id}. {problem.title}</h3>
              <div className="card-body">
                <p className="mb-2">{problem.description}</p>
                <hr />
                <div className="two_container">
                  <div className="line_container">
                    <div className="fw-bold problem_title">Up 포인트</div>
                    <div className="cominfo">{problem.uppoint ?? '-'}</div>
                  </div>
                  <div className="line_container">
                    <div className="fw-bold problem_title">난이도</div>
                    <div className="cominfo">LV.{problem.level ?? '-'}</div>
                  </div>
                </div>

                <div className="two_container">
                  <div className="line_container">
                    <div className="fw-bold problem_title">시간제한</div>
                    <div>
                      <TimeLimitBadge
                        isDaily={Boolean(problem.isDaily)}
                        dailyResetAt={problem.dailyResetAt}
                      />
                    </div>
                  </div>
                  <div className="line_container">
                    <div className="fw-bold problem_title">정답률</div>
                    <div>
                      <AnswerRate problemId={problem.id} wsUrl="wss://api.example.com/ws" />
                    </div>
                  </div>
                </div>

                <div className="two_container">
                  <div className="line_container">
                    <div className="mb-1 fw-bold">입력</div>
                    <div className="cominfo">{problem.input ?? '-'}</div>
                  </div>
                  <div className="line_container">
                    <div className="mb-1 fw-bold">출력</div>
                    <div className="cominfo">{problem.output ?? '-'}</div>
                  </div>
                </div>

                <div className="two_container">
                  <div className="line_container">
                    <div className="mb-1 fw-bold">예제 입력</div>
                    <div className="cominfo">
                      {(problem?.testCases ?? []).map((tc, i) => {
                        const input = tc?.inputData?.trim() ? tc.inputData : "없음";
                        return <div key={i}>{input}</div>;
                      })}
                    </div>
                  </div>
                  <div className="line_container">
                    <div className="mb-1 fw-bold">예제 출력</div>
                    <div className="cominfo">
                      {(problem?.testCases ?? []).map((tc, i) => {
                        const output = tc?.expectedOutput?.trim() ? tc.expectedOutput : "없음";
                        return <div key={i}>{output}</div>;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 에디터/탭 */}
          <div className="col-12 ">
            <div className="card">
              <div className="card-header p-0">
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${tab === "submit" ? "active" : ""}`}
                      onClick={() => setTab("submit")}
                    >
                      <span className="tab-label">제출</span>
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${tab === "others" ? "active" : ""}`}
                      onClick={() => setTab("others")}
                    >
                      <span className="tab-label">다른사람 풀이</span>
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${tab === "result" ? "active" : ""}`}
                      onClick={() => setTab("result")}
                      role="tab"
                      aria-selected={tab === "result"}
                    >
                      <span className="tab-label">채점 결과</span>
                      {submission?.result && (
                        <span className={`badge ms-2 ${statusClass(submission.result)}`}>
                          {submission.result}
                        </span>
                      )}
                    </button>
                  </li>
                </ul>
              </div>

              <div className="card-body">
                {tab === "submit" ? (
                  <>
                    <div className="mb-3 text-danger">comment : </div>
                    <div className="border rounded overflow-hidden">
                      <CodeEditor value={source} onChange={setSource} height="420px" />
                    </div>
                    {/* ✅ 언어 드롭다운 제거됨 (C 고정) */}
                  </>
                ) : tab === "others" ? (
                  <div className="text-muted">
                    아직 다른 사람 풀이가 없습니다. (추후 API 연동/목록 표 구현)
                  </div>
                ) : (
                  // 결과 탭
                  <div>
                    {submission ? (
                      <>
                        <div className="mb-2 d-flex align-items-center gap-2">
                          <span className={`badge ${statusClass(submission.result)}`}>
                            {resultLabel(submission.result)}
                          </span>
                          <span className="text-muted small">({String(submission.result)})</span>
                        </div>

                        {(() => {
                          if (!submission?.result) return null;
                          const r = String(submission.result).trim().toUpperCase();
                          if (r === "SUCCESS") return null;

                          const msgMap = {
                            FAIL: "오답입니다. 입출력 형식(개행/공백)과 예외 케이스를 다시 확인해 보세요.",
                            COMPILE_ERROR: "컴파일 오류입니다. 문법/헤더/세미콜론, 함수 시그니처를 확인하세요.",
                            RUNTIME_ERROR: "런타임 오류입니다. 0으로 나눔, 배열/포인터 범위, NULL 접근 등을 확인하세요.",
                            TIMEOUT: "시간 초과입니다. 알고리즘 복잡도를 줄이거나 입출력 최적화를 시도하세요.",
                            MEMORY_EXCEEDED: "메모리 초과입니다. 자료구조 크기를 줄이거나 불필요한 복제를 피하세요.",
                            PENDING: "채점 대기 중입니다.",
                            JUDGING: "채점 중입니다.",
                          };

                          const text = msgMap[r] ?? `결과: ${r}`;
                          const cls =
                            r === "FAIL" || r.endsWith("ERROR") || r === "TIMEOUT" || r === "MEMORY_EXCEEDED"
                              ? "alert alert-warning py-2"
                              : "alert alert-info py-2";

                          return <div className={cls}>{text}</div>;
                        })()}

                        <div className="d-flex flex-wrap gap-3">
                          <div>
                            <span className="badge bg-secondary me-2">실행시간</span>
                            {execMs != null ? `${execMs} ms` : "-"}
                          </div>
                          <div>
                            <span className="badge bg-secondary me-2">메모리</span>
                            {memKb != null ? `${memKb} KB` : "-"}
                          </div>
                          <div>
                            <span className="badge bg-secondary me-2">언어</span>
                            {submission.language ?? "c"}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-muted">아직 채점 결과가 없습니다.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 체크박스/타이머/제출 */}
        <div className="d-flex align-items-center gap-2 w-100 mb-2 flex-wrap">
          <label className="form-check d-flex align-items-center gap-2 m-0 flex-shrink-0">
            <input
              type="checkbox"
              className="form-check-input"
              checked={sharePublic}
              onChange={(e) => setSharePublic(e.target.checked)}
            />
            <span className="form-check-label">
              문제를 맞힐 경우 당신의 해답을 전체공개합니다
            </span>
          </label>

          <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0">
            <span className="badge bg-dark" title="페이지 진입부터 자동 측정">
              ⏱ {formatted}
            </span>
            <button className="btn btn-primary" onClick={handleSubmit}>제출</button>
          </div>
        </div>
      </div>
    </div>
  );
}

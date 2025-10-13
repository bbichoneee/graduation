// x. 문제풀기 페이지 

// src/pages/SolveQ.jsx
import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import problemsData from "../../data/problems.json"; 
import "./SolveQ.scss";
import MenuBar from "../../components/common/MenuBar";
import TimeLimitBadge from "../Qbank/TimeLimitBadge";
import AnswerRate from "../Qbank/AnswerRate";
import useSolveTimer, { formatDuration } from "../../components/hooks/useSolveTimer";
import CodeEditor from "../../components/utility/CodeEditor";

export default function SolveQ() {
  const { id } = useParams();
  const pid = Number(id);

  const problem = useMemo(
    () => problemsData.find((p) => Number(p.id) === pid),
    [pid]
  );

  const [tab, setTab] = useState("submit"); // submit | others
  const [lang, setLang] = useState("c");
  const [sharePublic, setSharePublic] = useState(false);

  // ✅ 스톱워치 훅 사용(페이지 진입 시 자동 측정 / 제출 시 기록)
  const { formatted, recordSubmit } = useSolveTimer();

  const [source, setSource] = useState(
    `#include <stdio.h>

int main(void) 
{
        // 여기에 코드를 작성하세요
return 0;
}
    `
  );

  if (!problem) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          해당 문제를 찾을 수 없습니다. <Link to="/qbank">문제은행으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    // ✅ 제출 시 경과시간(ms) 확보
    const usedMs = recordSubmit();
    // TODO: 채점 API 호출 시, usedMs와 sharePublic도 함께 전송
    // await post('/api/submit', { problemId: problem.id, lang, source, usedMs, sharePublic })
    alert(`제출 완료! 풀이 시간 : ${formatDuration(usedMs)}`);
  };

  return (
    <div>
      <MenuBar />
      <div className="container py-4">
        <div className="d-flex me-auto align-items-center justify-content-center mb-3 gap-2">
          <Link to="/qbank" className="btn btn-outline-secondary btn-sm">← 문제은행</Link>
        </div>

        {/* 문제 설명 + 에디터 영역 */}
        <div className="row g-3 mb-3 ">
          {/* 문제 설명 */}
          <div className="col-12">
            <div className="card">
              <h3 className="m-3">#{problem.id}. {problem.title}</h3>
              <div className="card-body">
                <p className="mb-2">{problem.description}</p>
                <hr />
                <div className="two_container">
                  <div className="line_container">
                    <div className="fw-bold problem_title">Up 포인트</div>
                    <div className="cominfo">{problem.uppoint}</div>
                  </div>
                  <div className="line_container">
                    <div className="fw-bold problem_title">난이도</div>
                    <div className="cominfo">LV.{problem.level}</div>
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
                    <div className="cominfo">{problem.input}</div>
                  </div>
                  <div className="line_container">
                    <div className="mb-1 fw-bold">출력</div>
                    <div className="cominfo">{problem.output}</div>
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
                </ul>
              </div>

              <div className="card-body">
                {tab === "submit" ? (
                  <>
                    <div className="mb-3 text-danger">comment : </div>
                    <div className="border rounded overflow-hidden">
                      <CodeEditor value={source} onChange={setSource} height="420px" />
                    </div>
                  </>
                ) : (
                  <div className="text-muted">
                    아직 다른 사람 풀이가 없습니다. (추후 API 연동/목록 표 구현)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 w-100 mb-2 flex-wrap">
          {/* 왼쪽: 체크박스 */}
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

          {/* 오른쪽: 타이머 + 제출 버튼 */}
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

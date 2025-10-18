package com.Loop.CodeStartUP.domain.submission;

import com.Loop.CodeStartUP.domain.problem.Problem;
import com.Loop.CodeStartUP.domain.problem.ProblemRepository;
import com.Loop.CodeStartUP.domain.problem.dto.TestCase;
import com.Loop.CodeStartUP.enums.SubmissionResult;
import com.Loop.CodeStartUP.external.Judge0Client;
import com.Loop.CodeStartUP.external.judge0.dto.Judge0SubmitRequest;
import com.Loop.CodeStartUP.external.judge0.dto.Judge0SubmitResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final Judge0Client judge0Client;

    /** 코드 제출 및 채점 */
    @Transactional
    public Submission submit(Long problemId, String code, String language) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("문제를 찾을 수 없습니다."));

        Submission submission = Submission.builder()
                .problem(problem)
                .code(code)
                .language(language)
                .build();

        submissionRepository.save(submission);
        submission.startJudging();

        try {
            SubmissionResult result = judgeWithJudge0(problem, code);
            // time/memory도 Judge0 응답 사용하려면 DTO 추가로 받아서 넣으면 됨
            submission.updateResult(result, 0.1, 1024L);
        } catch (Exception e) {
            log.error("❌ 채점 중 오류 발생", e);
            submission.updateResult(SubmissionResult.RUNTIME_ERROR, null, null);
        }

        return submission;
    }

    /** Judge0로 채점 실행 */
    private SubmissionResult judgeWithJudge0(Problem problem, String code) {
        List<TestCase> testCases = problem.getTestCases();
        if (testCases.isEmpty()) {
            log.warn("⚠️ 테스트 케이스가 없습니다. 문제 ID: {}", problem.getId());
            return SubmissionResult.SUCCESS;
        }

        TestCase testCase = testCases.get(0);

        // ✅ Judge0 요청 만들기 (C: 50)
        Judge0SubmitRequest req = new Judge0SubmitRequest();
        req.setLanguageId(50);
        req.setSourceCode(code);

        // ✅ stdin 보정 (scanf EOF 방지)
        String stdin = testCase.getInputData();
        if (stdin == null) stdin = "";
        if (!stdin.endsWith("\n")) stdin += "\n";
        req.setStdin(stdin);

        // ✅ expected_output 보정 (개행까지 일치)
        String expected = testCase.getExpectedOutput();
        if (expected == null) expected = "";
        if (!expected.endsWith("\n")) expected += "\n";
        req.setExpectedOutput(expected);

        // ✅ Judge0 호출
        Judge0SubmitResponse res = judge0Client.submitAndWait(req);

        if (res == null || res.getStatus() == null) {
            log.error("❌ Judge0 응답 비정상: {}", res);
            return SubmissionResult.RUNTIME_ERROR;
        }

        if ((res.getCompileOutput() != null && !res.getCompileOutput().trim().isEmpty())
                || (res.getStatus() != null &&
                (res.getStatus().getId() == 6 || res.getStatus().getId() == 13))) {
            log.error("⚠️ Judge0 컴파일 에러 감지됨: {}", res.getCompileOutput());
            return SubmissionResult.COMPILE_ERROR;
        }



        Integer statusId = res.getStatus().getId();
        log.info("✅ Judge0 status.id={}, desc={}, stdout='{}', stderr='{}', ce='{}'",
                statusId,
                res.getStatus().getDescription(),
                res.getStdout(), res.getStderr(), res.getCompileOutput());

        return mapJudge0StatusToResult(statusId);
    }

    /** Judge0 상태 ID → SubmissionResult 매핑 */
    private SubmissionResult mapJudge0StatusToResult(Integer statusId) {
        return switch (statusId) {
            case 3 -> SubmissionResult.SUCCESS;        // Accepted
            case 4 -> SubmissionResult.FAIL;           // Wrong Answer
            case 5 -> SubmissionResult.TIMEOUT;        // Time Limit Exceeded
            case 6 -> SubmissionResult.COMPILE_ERROR;  // Compilation Error
            case 7, 8, 9, 10, 11, 12 -> SubmissionResult.RUNTIME_ERROR; // Runtime Error 계열
            default -> SubmissionResult.RUNTIME_ERROR;
        };
    }

    /** 제출 단건 조회 */
    public Submission getSubmission(Long submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("제출을 찾을 수 없습니다."));
    }
}

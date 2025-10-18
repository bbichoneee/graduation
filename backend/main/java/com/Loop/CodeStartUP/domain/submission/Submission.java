package com.Loop.CodeStartUP.domain.submission;

import com.Loop.CodeStartUP.domain.common.BaseEntity; // ✅ 경로 수정
import com.Loop.CodeStartUP.domain.problem.Problem;
import com.Loop.CodeStartUP.enums.SubmissionResult;   // ✅ 경로 수정
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "submissions",
        indexes = {
                @Index(name = "idx_submission_problem", columnList = "problem_id"),
                @Index(name = "idx_submission_result", columnList = "result"),
                @Index(name = "idx_submission_created_at", columnList = "created_at")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Submission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubmissionResult result;

    @Column(name = "execution_time_ms")
    private Double executionTimeMs;

    @Column(name = "memory_usage_kb")
    private Long memoryUsageKb;

    @Column(nullable = false, length = 50)
    private String language;

    @Builder
    public Submission(Problem problem, String code, String language) {
        validateSubmission(problem, code, language);
        this.problem = problem;
        this.code = code;
        this.language = language;
        this.result = SubmissionResult.PENDING;
    }

    // ======== 비즈니스 로직 ========

    public void startJudging() {
        if (this.result != SubmissionResult.PENDING) {
            throw new IllegalStateException("채점 대기 중인 제출만 채점을 시작할 수 있습니다.");
        }
        this.result = SubmissionResult.JUDGING;
    }

    public void updateResult(SubmissionResult result, Double executionTimeMs, Long memoryUsageKb) {
        if (result == null) throw new IllegalArgumentException("채점 결과는 필수입니다.");
        if (result == SubmissionResult.PENDING || result == SubmissionResult.JUDGING)
            throw new IllegalArgumentException("최종 채점 결과만 설정할 수 있습니다.");
        if (this.result != SubmissionResult.PENDING && this.result != SubmissionResult.JUDGING)
            throw new IllegalStateException("이미 채점이 완료된 제출입니다.");

        this.result = result;
        this.executionTimeMs = executionTimeMs;
        this.memoryUsageKb = memoryUsageKb;
    }

    public boolean isSuccess() {
        return this.result == SubmissionResult.SUCCESS;
    }

    public boolean isFail() {
        return this.result == SubmissionResult.FAIL;
    }

    public boolean isError() {
        return this.result == SubmissionResult.RUNTIME_ERROR
                || this.result == SubmissionResult.COMPILE_ERROR
                || this.result == SubmissionResult.TIMEOUT
                || this.result == SubmissionResult.MEMORY_EXCEEDED;
    }

    public boolean isJudged() {
        return this.result != SubmissionResult.PENDING
                && this.result != SubmissionResult.JUDGING;
    }

    private void validateSubmission(Problem problem, String code, String language) {
        if (problem == null) throw new IllegalArgumentException("문제는 필수입니다.");
        if (code == null || code.trim().isEmpty()) throw new IllegalArgumentException("코드는 필수입니다.");
        if (language == null || language.trim().isEmpty()) throw new IllegalArgumentException("언어는 필수입니다.");
    }
}

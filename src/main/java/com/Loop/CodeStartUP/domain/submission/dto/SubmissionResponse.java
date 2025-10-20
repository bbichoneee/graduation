package com.Loop.CodeStartUP.domain.submission.dto;

import com.Loop.CodeStartUP.domain.submission.Submission;
import lombok.Getter;

@Getter
public class SubmissionResponse {
    private final Long id;
    private final Long problemId;
    private final String result;
    private final Double executionTimeMs;
    private final Long memoryUsageKb;
    private final String language;

    public SubmissionResponse(Submission submission) {
        this.id = submission.getId();
        this.problemId = submission.getProblem().getId();
        this.result = submission.getResult().name();
        this.executionTimeMs = submission.getExecutionTimeMs();
        this.memoryUsageKb = submission.getMemoryUsageKb();
        this.language = submission.getLanguage();
    }
}

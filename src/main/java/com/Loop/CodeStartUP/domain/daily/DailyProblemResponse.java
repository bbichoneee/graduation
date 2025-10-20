package com.Loop.CodeStartUP.domain.daily;

import lombok.Getter;

@Getter
public class DailyProblemResponse {
    private final Long problemId;
    private final String title;
    private final String description;
    private final String status;
    private final String date;

    public DailyProblemResponse(DailyProblem daily) {
        this.problemId = daily.getProblem().getId();
        this.title = daily.getProblem().getTitle();
        this.description = daily.getProblem().getDescription();
        this.status = daily.getStatus().name();
        this.date = daily.getDate().toString();
    }
}

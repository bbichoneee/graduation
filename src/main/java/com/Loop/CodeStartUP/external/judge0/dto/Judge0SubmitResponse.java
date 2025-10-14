package com.Loop.CodeStartUP.external.judge0.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Judge0 제출 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
public class Judge0SubmitResponse {
    private String stdout;          // 프로그램 출력
    private String stderr;          // 표준 에러

    @JsonProperty("compile_output")
    private String compileOutput;  // 컴파일 에러 메시지

    private String message;         // 런타임 메시지
    private Status status;          // 상태 정보
    private String token;           // 제출 식별 토큰

    // ✅ 추가된 필드 (Judge0 실행 결과 정보)
    private Double time;            // 실행 시간 (초)
    private Integer memory;            // 메모리 사용량 (KB)

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Status {
        private Integer id;          // Judge0 상태 코드
        private String description;  // 상태 설명
    }
}

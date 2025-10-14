package com.Loop.CodeStartUP.domain.submission.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 클라이언트에서 제출 요청 시 사용하는 DTO
 */
@Getter
@Setter
public class SubmissionRequest {
    private Long problemId;   // 어떤 문제에 대한 제출인지
    private String code;      // 제출한 코드
    private String language;  // 사용 언어 (지금은 C 고정이어도 유지)
}

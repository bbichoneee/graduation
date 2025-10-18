package com.Loop.CodeStartUP.enums;

public enum SubmissionResult {
    PENDING,          // 제출 대기
    JUDGING,          // 채점 중
    SUCCESS,          // 정답
    FAIL,             // 오답
    COMPILE_ERROR,    // 컴파일 오류
    RUNTIME_ERROR,    // 런타임 오류
    TIMEOUT,          // 시간 초과
    MEMORY_EXCEEDED   // 메모리 초과
}

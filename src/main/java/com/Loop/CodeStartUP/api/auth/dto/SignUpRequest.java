package com.Loop.CodeStartUP.api.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class SignUpRequest {

    @NotBlank
    private String username;  // 로그인용 ID 또는 이메일

    @NotBlank
    private String password;

    @NotBlank
    private String nickname;

    private String profileImageUrl; // 선택 사항
}

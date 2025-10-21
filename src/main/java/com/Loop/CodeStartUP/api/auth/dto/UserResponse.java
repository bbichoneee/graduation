package com.Loop.CodeStartUP.api.auth.dto;

import com.Loop.CodeStartUP.domain.user.User;
import lombok.Getter;

@Getter
public class UserResponse {
    private final Long id;
    private final String username;
    private final String nickname;
    private final String profileImageUrl;

    public UserResponse(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.nickname = user.getNickname();
        this.profileImageUrl = user.getProfileImageUrl();
    }
}

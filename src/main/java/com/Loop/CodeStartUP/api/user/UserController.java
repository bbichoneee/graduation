package com.Loop.CodeStartUP.api.user;

import com.Loop.CodeStartUP.api.auth.dto.UserResponse;
import com.Loop.CodeStartUP.domain.user.User;
import com.Loop.CodeStartUP.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        // 🔹 Username (= 식별자) 꺼내기
        String username = authentication.getName();

        // 🔹 DB에서 사용자 다시 조회
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return ResponseEntity.ok(new UserResponse(user));
    }
}

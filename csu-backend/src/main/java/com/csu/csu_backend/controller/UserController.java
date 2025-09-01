package com.csu.csu_backend.controller;

import com.csu.csu_backend.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        // JwtAuthFilter에서 인증 성공 시 SecurityContext에 UserDetails가 들어감
        var principal = (CustomUserDetails) authentication.getPrincipal();

        return Map.of(
                "ok", true,
                "username", principal.getUsername(),
                "nickname", principal.getNickname(),
                "email", principal.getEmail(),
                "role", principal.getAuthorities().iterator().next().getAuthority()
        );
    }
}

package com.csu.csu_backend.controller;

import com.csu.csu_backend.config.jwt.JwtUtil;
import com.csu.csu_backend.entity.User;
import com.csu.csu_backend.security.CustomUserDetails;
import com.csu.csu_backend.service.UserService;
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public record SignupReq(String username, String password, String nickname) {}
    public record LoginReq(String username, String password) {}

    @PermitAll
    @PostMapping("/signup")
    public Map<String, Object> signup(@RequestBody SignupReq req) {
        Long id = userService.signup(req.username(), req.password(), req.nickname());
        return Map.of("ok", true, "id", id);
    }

    @PermitAll
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginReq req) {
        User user = userService.verifyLogin(req.username(), req.password());
        String token = jwtUtil.generateToken(user.getUsername());
        return Map.of(
            "ok", true,
            "token", token,
            "username", user.getUsername(),
            "nickname", user.getNickname(),
            "email", user.getEmail(),
            "role", user.getRole().name()
        );
    }

    // 인증 필요: 토큰 없으면 401
    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal CustomUserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return Map.of(
            "username", principal.getUsername(),
            "nickname", principal.getNickname(),
            "email", principal.getEmail(),
            "role", principal.getAuthorities().iterator().next().getAuthority()
        );
    }
}

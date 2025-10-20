package com.Loop.CodeStartUP.api.auth;

import com.Loop.CodeStartUP.api.auth.dto.*;
import com.Loop.CodeStartUP.global.security.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtils jwtUtils;


    @Value("${jwt.refresh-cookie-name}") private String refreshCookieName;
    @Value("${jwt.refresh-header-name}") private String refreshHeaderName;
    @Value("${jwt.refresh-token-validity-ms}") private long refreshTtlMs;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody @Valid LoginRequest req, HttpServletResponse res) {
        var bundle = authService.login(req);
        setRefreshIntoCookieAndHeader(res, bundle.refreshToken());
        return ResponseEntity.ok(new TokenResponse(bundle.accessToken(), "Bearer"));
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponse> signup(@RequestBody @Valid SignUpRequest req) {
        return ResponseEntity.ok(authService.signup(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = jwtUtils.extractRefreshToken(request);
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TokenResponse newTokens = authService.refreshTokens(refreshToken, response);
        return ResponseEntity.ok(newTokens);
    }

    private void setRefreshIntoCookieAndHeader(HttpServletResponse res, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(refreshCookieName, refreshToken)
                .httpOnly(true)
                .secure(true) // 로컬 테스트 시 필요하면 false로 변경
                .sameSite("None")
                .path("/")
                .maxAge(refreshTtlMs / 1000)
                .build();
        res.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        res.addHeader(refreshHeaderName, refreshToken);
    }
}

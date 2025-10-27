package com.Loop.CodeStartUP.api.auth;

import com.Loop.CodeStartUP.api.auth.dto.LoginRequest;
import com.Loop.CodeStartUP.api.auth.dto.SignUpRequest;
import com.Loop.CodeStartUP.api.auth.dto.TokenResponse;
import com.Loop.CodeStartUP.api.auth.dto.UserResponse;
import com.Loop.CodeStartUP.domain.user.*;
import com.Loop.CodeStartUP.global.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 로그인 요청 처리
     */
    @Transactional
    public TokenBundle login(LoginRequest req) {
        // (1) Spring Security 인증: username + password 확인
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
        );

        // (2) 유저 조회
        var user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다."));

        // (3) AccessToken + RefreshToken 발급
        String access = tokenProvider.createAccessToken(
                user.getUsername(),
                Map.of("uid", user.getId())
        );
        String refresh = tokenProvider.createRefreshToken(user.getUsername());

        // (4) 기존 리프레시 삭제 후 새로 저장 (로테이션)
        refreshTokenRepository.deleteByUser(user);
        var entity = RefreshToken.builder()
                .user(user)
                .token(refresh)
                .expiresAt(tokenProvider.getExpiration(refresh).toInstant())
                .revoked(false)
                .build();
        refreshTokenRepository.save(entity);

        // (5) 토큰 세트 반환
        return new TokenBundle(access, refresh);
    }

    @Transactional
    public UserResponse signup(SignUpRequest req) {
        // username 중복 검사
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(req.getPassword());

        // 유저 생성
        var user = User.builder()
                .username(req.getUsername())
                .password(encodedPassword)
                .nickname(req.getNickname())
                .profileImageUrl(req.getProfileImageUrl())
                .build();

        userRepository.save(user);
        return new UserResponse(user);
    }

    @Transactional
    public TokenResponse refreshTokens(String refreshToken, HttpServletResponse response) {
        // 1️⃣ 토큰 유효성 검증
        if (!tokenProvider.validate(refreshToken)) {
            throw new IllegalArgumentException("리프레시 토큰이 유효하지 않습니다.");
        }

        // 2️⃣ DB에 저장된 토큰인지 확인
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리프레시 토큰입니다."));

        if (storedToken.isRevoked()) {
            throw new IllegalArgumentException("이미 만료된 리프레시 토큰입니다.");
        }

        // 3️⃣ 유저 조회
        User user = storedToken.getUser();

        // 4️⃣ 새로운 Access Token 생성
        Map<String, Object> claims = Map.of("userId", user.getId());
        String newAccessToken = tokenProvider.createAccessToken(user.getUsername(), claims); // ✅ 수정 (nickname → username)

        // 5️⃣ 새로운 Refresh Token 발급 (기존 토큰 폐기)
        refreshTokenRepository.delete(storedToken);
        String newRefreshToken = tokenProvider.createRefreshToken(user.getUsername()); // ✅ 수정 (nickname → username)
        Date expiry = tokenProvider.getExpiration(newRefreshToken);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(newRefreshToken)
                .expiresAt(expiry.toInstant()) // ← 여긴 Date → Instant 변환 그대로 유지 가능
                .revoked(false)
                .build());

        // 6️⃣ 새 쿠키 설정
        ResponseCookie cookie = ResponseCookie.from("refresh_token", newRefreshToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(tokenProvider.getRefreshValiditySeconds())
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        response.addHeader("X-Refresh-Token", newRefreshToken);

        return new TokenResponse(newAccessToken, "Bearer");
    }

    public record TokenBundle(String accessToken, String refreshToken) {}
}

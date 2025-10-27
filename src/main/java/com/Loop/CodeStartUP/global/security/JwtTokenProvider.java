package com.Loop.CodeStartUP.global.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.access-token-validity-ms}") private long accessValidityMs;
    @Value("${jwt.refresh-token-validity-ms}") private long refreshValidityMs;
    @Value("${jwt.issuer}") private String issuer;

    private Key key;

    @PostConstruct
    void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    /** 액세스 토큰 생성 */
    public String createAccessToken(String subject, Map<String, Object> claims) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusMillis(accessValidityMs)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** 리프레시 토큰 생성 */
    public String createRefreshToken(String subject) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(subject)
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusMillis(refreshValidityMs)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** 토큰 만료일 반환 */
    public Date getExpiration(String token) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build()
                    .parseClaimsJws(token)
                    .getBody().getExpiration();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("❌ JWT 만료일 조회 실패: {}", e.getMessage());
            return null;
        }
    }

    /** JWT 파싱 (검증 포함) */
    public Jws<Claims> parse(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
        } catch (ExpiredJwtException e) {
            log.warn("❌ JWT 만료됨: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            log.warn("❌ 잘못된 JWT 형식: {}", e.getMessage());
            throw e;
        } catch (SignatureException e) {
            log.warn("❌ JWT 서명 검증 실패: {}", e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            log.warn("❌ JWT 파싱 실패 (빈 문자열 또는 null): {}", e.getMessage());
            throw e;
        }
    }

    public boolean validate(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("❌ JWT 유효성 검사 실패: {}", e.getMessage());
            return false;
        }
    }

    public long getRefreshValiditySeconds() {
        return refreshValidityMs / 1000;
    }
}

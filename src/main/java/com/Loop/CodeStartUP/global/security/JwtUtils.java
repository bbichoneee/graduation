package com.Loop.CodeStartUP.global.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

@Component
public class JwtUtils {

    public String extractRefreshToken(HttpServletRequest request) {
        // ✅ 1. 헤더에서 찾기
        String headerToken = request.getHeader("X-Refresh-Token");
        if (headerToken != null && !headerToken.isBlank()) {
            return headerToken;
        }

        // ✅ 2. 쿠키에서 찾기
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if (cookie.getName().equals("refresh_token")) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}

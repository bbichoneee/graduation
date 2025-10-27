package com.Loop.CodeStartUP.global.security;

import com.Loop.CodeStartUP.domain.user.CustomUserDetailsService;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String bearer = request.getHeader("Authorization");

        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            String token = bearer.substring(7);

            // ✅ undefined, null, 빈 문자열 방어
            if (StringUtils.hasText(token) && !"undefined".equals(token)) {
                try {
                    String username = tokenProvider.parse(token)
                            .getBody()
                            .getSubject();

                    var userDetails = userDetailsService.loadUserByUsername(username);
                    if (userDetails != null) {
                        var authentication = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } catch (Exception e) {
                    // ✅ JWT 파싱, 만료, 서명 불일치 등 예외 처리
                    log.warn("❌ JWT 인증 실패 [{}]: {}", e.getClass().getSimpleName(), e.getMessage());
                }
            } else {
                log.debug("⚠️ Authorization 헤더에 토큰이 없거나 잘못된 값 (undefined/null)");
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // ✅ /api/auth/** 요청은 필터에서 제외
        return path.startsWith("/api/auth/");
    }
}

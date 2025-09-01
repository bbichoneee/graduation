package com.csu.csu_backend.service;

import com.csu.csu_backend.entity.User;
import com.csu.csu_backend.repository.UserRepository;
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PermitAll
    public Long signup(String username, String rawPassword, String nickname) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("username already exists");
        }
        User u = new User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword)); // BCrypt 저장
        u.setNickname(nickname);
        // u.setEmail(...); // 필요하면
        // u.setRole(Role.USER); // 기본 권한 설정
        return userRepository.save(u).getId();
    }

    @PermitAll
    public User verifyLogin(String username, String rawPassword) {
        User u = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("user not found"));
        if (!passwordEncoder.matches(rawPassword, u.getPassword())) {
            throw new IllegalArgumentException("invalid password");
        }
        return u;
    }
}

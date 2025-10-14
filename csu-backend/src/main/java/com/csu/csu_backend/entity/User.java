package com.csu.csu_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;   // 로그인 ID

    @Column(nullable = false)
    private String password;   // 암호화 저장 (BCrypt)

    @Column(nullable = false, length = 30)
    private String nickname;   // 닉네임

    @Column(unique = true, nullable = false, length = 100)
    private String email;      // 이메일

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;         // USER / ADMIN
}

package com.Loop.CodeStartUP.domain.user;

import com.Loop.CodeStartUP.domain.common.SoftDeletableEntity;
import com.Loop.CodeStartUP.domain.submission.Submission;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;



@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?")
@Where(clause = "deleted_at IS NULL")
public class User extends SoftDeletableEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    // ✅ 로그인용 username 필드 추가 (email 또는 아이디 등)
    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "cached_total_points", nullable = false)
    private int cachedTotalPoints = 0;

    @Column(name = "cached_level", nullable = false)
    private int cachedLevel = 1;

    // 연관관계 - cascade 없음 (독립적 관리)
    @OneToMany(mappedBy = "user")
    private List<Submission> submissions = new ArrayList<>();

    //@OneToMany(mappedBy = "user")
    //private List<Point> pointHistory = new ArrayList<>();

    //@OneToMany(mappedBy = "user")
    //private List<Ranking> rankings = new ArrayList<>();

    //@OneToMany(mappedBy = "user")
    //private List<DailyProblemAssignment> assignments = new ArrayList<>();
        

    @Builder
    public User(String username, String nickname, String password, String profileImageUrl) {
        this.username = username;
        this.nickname = nickname;
        this.password = password;
        this.profileImageUrl = profileImageUrl;
        this.cachedTotalPoints = 0;
        this.cachedLevel = 1;
    }

    // ======== 비즈니스 로직 ========

    public void addPoints(int points) {
        if (points < 0) throw new IllegalArgumentException("포인트는 음수일 수 없습니다.");
        this.cachedTotalPoints += points;
        updateLevel();
    }

    private void updateLevel() {
        int newLevel = (this.cachedTotalPoints / 100) + 1;
        if (newLevel > this.cachedLevel) this.cachedLevel = newLevel;
    }

    public void updateNickname(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            throw new IllegalArgumentException("닉네임은 필수입니다.");
        }
        this.nickname = nickname;
    }

    public void updateProfileImage(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void updatePassword(String encodedPassword) {
        if (encodedPassword == null || encodedPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("비밀번호는 필수입니다.");
        }
        this.password = encodedPassword;
    }

    public void updateCachedPoints(int totalPoints) {
        if (totalPoints < 0) throw new IllegalArgumentException("총 포인트는 음수일 수 없습니다.");
        this.cachedTotalPoints = totalPoints;
        updateLevel();
    }

    // ======== JWT 인증 관련 ========

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of((GrantedAuthority) () -> "ROLE_USER");
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}

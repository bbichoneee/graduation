package com.Loop.CodeStartUP.domain.daily;

import com.Loop.CodeStartUP.domain.common.BaseEntity;
import com.Loop.CodeStartUP.domain.problem.Problem;
import com.Loop.CodeStartUP.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(name = "daily_problems",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "date"})
        })
public class DailyProblem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "daily_problem_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false)
    private LocalDate date;  // 제공 날짜

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DailyStatus status; // NOT_STARTED, IN_PROGRESS, COMPLETED

    // ✅ 하루 문제 상태 변경용 메서드
    public void markInProgress() {
        this.status = DailyStatus.IN_PROGRESS;
    }

    public void markCompleted() {
        this.status = DailyStatus.COMPLETED;
    }
}

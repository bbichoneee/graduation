package com.Loop.CodeStartUP.domain.daily;

import com.Loop.CodeStartUP.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DailyProblemRepository extends JpaRepository<DailyProblem, Long> {

    // ✅ 오늘 날짜의 문제 조회
    Optional<DailyProblem> findByUserAndDate(User user, LocalDate date);
}

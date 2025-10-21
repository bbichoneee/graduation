package com.Loop.CodeStartUP.domain.submission;

import com.Loop.CodeStartUP.domain.problem.Problem;
import com.Loop.CodeStartUP.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    // 기존
    Long countByProblem_Id(Long problemId);
    Submission findTopByProblem_IdOrderByCreatedAtDesc(Long problemId);

    // ✅ 오늘 날짜 기준으로 유저 + 문제별 제출 횟수 (시간대 이슈 해결)
    @Query("""
        SELECT COUNT(s)
        FROM Submission s
        WHERE s.user = :user
          AND s.problem = :problem
          AND FUNCTION('DATE', s.createdAt) = :today
    """)
    long countTodaySubmissions(
            @Param("user") User user,
            @Param("problem") Problem problem,
            @Param("today") LocalDate today
    );
}

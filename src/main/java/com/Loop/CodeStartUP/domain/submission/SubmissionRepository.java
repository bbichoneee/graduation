package com.Loop.CodeStartUP.domain.submission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    // ✅ 특정 문제에 대한 제출 개수
    Long countByProblem_Id(Long problemId);

    // ✅ 특정 문제의 최근 제출 하나 (선택)
    Submission findTopByProblem_IdOrderByCreatedAtDesc(Long problemId);
}

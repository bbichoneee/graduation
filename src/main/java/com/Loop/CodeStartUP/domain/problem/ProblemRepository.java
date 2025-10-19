package com.Loop.CodeStartUP.domain.problem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {

    // ✅ 문제 제목으로 검색 (선택사항)
    boolean existsByTitle(String title);

    // ✅ 순번으로 문제 찾기 (선택사항)
    Problem findByOrderNum(int orderNum);
}

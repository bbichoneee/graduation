package com.Loop.CodeStartUP.domain.ranking;

import com.Loop.CodeStartUP.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RankingRepository extends JpaRepository<Ranking, Long> {
    Optional<Ranking> findByUser(User user);
    List<Ranking> findAllByOrderByTotalScoreDesc();
}
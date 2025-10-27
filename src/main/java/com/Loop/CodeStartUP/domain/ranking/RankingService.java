package com.Loop.CodeStartUP.domain.ranking;

import com.Loop.CodeStartUP.domain.problem.Problem;
import com.Loop.CodeStartUP.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RankingService {

    private final RankingRepository rankingRepo;

    /** 정답 제출 시 점수 추가 */
    @Transactional
    public void addScore(User user, Problem problem) {
        Ranking ranking = rankingRepo.findByUser(user)
                .orElseGet(() -> Ranking.builder()
                        .user(user)
                        .totalScore(0)
                        .build());

        ranking.setTotalScore(ranking.getTotalScore() + problem.getScore());
        rankingRepo.save(ranking);
    }

    /** 랭킹 전체 조회 (점수 내림차순) */
    public List<Ranking> getAllRanking() {
        return rankingRepo.findAllByOrderByTotalScoreDesc();
    }
}

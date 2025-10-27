package com.Loop.CodeStartUP.domain.ranking;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    /** 전체 랭킹 조회 */
    @GetMapping
    public List<Ranking> getRanking() {
        return rankingService.getAllRanking();
    }
}

package com.Loop.CodeStartUP.enums;

/**
 * 문제 난이도 1~5단계 (점수 자동 매핑)
 * 1단계 10점, 2단계 20점, 3단계 30점, 4단계 40점, 5단계 50점
 */
public enum Difficulty {
    LEVEL_1(10),
    LEVEL_2(20),
    LEVEL_3(30),
    LEVEL_4(40),
    LEVEL_5(50);

    private final int score;

    Difficulty(int score) {
        this.score = score;
    }

    public int getScore() {
        return score;
    }
}

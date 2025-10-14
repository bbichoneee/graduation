package com.Loop.CodeStartUP.domain.problem;

import com.Loop.CodeStartUP.domain.common.SoftDeletableEntity;
import com.Loop.CodeStartUP.domain.problem.dto.TestCase;
import com.Loop.CodeStartUP.enums.Difficulty;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "problems",
        indexes = {
                @Index(name = "idx_problem_difficulty", columnList = "difficulty")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE problems SET deleted_at = CURRENT_TIMESTAMP WHERE problem_id = ?")
@Where(clause = "deleted_at IS NULL")
public class Problem extends SoftDeletableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "problem_id")
    private Long id; // ⚙️ DB에서 자동 생성되는 PK

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty;

    @Column(name = "order_num", nullable = false)
    private int orderNum; // ⚙️ JSON의 id 값을 이 필드에 매핑

    @Column(name = "cached_accuracy_rate", nullable = false)
    private double cachedAccuracyRate = 0.0;

    // ⭐ 테스트 케이스를 JSON 문자열로 저장
    @Column(name = "test_cases", columnDefinition = "TEXT", nullable = false)
    private String testCasesJson;

    // ⭐ JSON 변환용 ObjectMapper
    @Transient
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // ⚙️ Builder (difficulty, orderNum 기본값 처리)
    @Builder
    public Problem(String title, String description, Difficulty difficulty, int orderNum, String testCasesJson) {
        validateTitle(title);
        this.title = title;
        this.description = description;
        this.difficulty = (difficulty != null) ? difficulty : Difficulty.EASY; // ✅ 기본값 EASY
        this.orderNum = (orderNum > 0) ? orderNum : 1;                         // ✅ JSON id → orderNum
        this.testCasesJson = (testCasesJson != null) ? testCasesJson : "[]";
        this.cachedAccuracyRate = 0.0;
    }

    // ======== JSON 변환 로직 ========

    public List<TestCase> getTestCases() {
        try {
            return objectMapper.readValue(testCasesJson, new TypeReference<List<TestCase>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    public void setTestCases(List<TestCase> testCases) {
        try {
            this.testCasesJson = objectMapper.writeValueAsString(testCases);
        } catch (JsonProcessingException e) {
            this.testCasesJson = "[]";
        }
    }

    // ======== 비즈니스 로직 ========

    public void update(String title, String description, Difficulty difficulty) {
        if (title != null && !title.trim().isEmpty()) {
            validateTitle(title);
            this.title = title;
        }
        if (description != null) this.description = description;
        if (difficulty != null) this.difficulty = difficulty;
    }

    public void updateOrder(int orderNum) {
        validateOrderNum(orderNum);
        this.orderNum = orderNum;
    }

    public void updateCachedAccuracyRate(double accuracyRate) {
        if (accuracyRate < 0.0 || accuracyRate > 100.0) {
            throw new IllegalArgumentException("정답률은 0.0에서 100.0 사이여야 합니다.");
        }
        this.cachedAccuracyRate = accuracyRate;
    }

    // ======== 검증 메서드 ========

    private void validateTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("제목은 필수입니다.");
        }
        if (title.length() > 200) {
            throw new IllegalArgumentException("제목은 200자를 초과할 수 없습니다.");
        }
    }

    private void validateOrderNum(int orderNum) {
        if (orderNum < 1) {
            throw new IllegalArgumentException("순서는 1 이상이어야 합니다.");
        }
    }
}

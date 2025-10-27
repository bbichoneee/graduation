package com.Loop.CodeStartUP.loader;

import com.Loop.CodeStartUP.domain.problem.Problem;
import com.Loop.CodeStartUP.domain.problem.ProblemRepository;
import com.Loop.CodeStartUP.domain.problem.dto.TestCase;
import com.Loop.CodeStartUP.enums.Difficulty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProblemDataLoader implements CommandLineRunner {

    private final ProblemRepository problemRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void run(String... args) throws Exception {
        if (problemRepository.count() > 0) {
            log.info("문제 데이터가 이미 존재합니다. 로드를 건너뜁니다.");
            return;
        }

        log.info("JSON 파일에서 문제 데이터 로드 시작...");

        InputStream is = getClass().getResourceAsStream("/Problem.json");
        if (is == null) {
            log.error("Problem.json 파일을 찾을 수 없습니다!");
            return;
        }

        List<ProblemDto> problemDtos = objectMapper.readValue(is, new TypeReference<>() {});

        for (ProblemDto dto : problemDtos) {
            String testCasesJson = objectMapper.writeValueAsString(dto.getTestCases());

            // ✅ JSON에 난이도가 없으면 기본 LEVEL_1로 설정
            Difficulty difficulty = Difficulty.LEVEL_1;
            if (dto.getDifficulty() != null) {
                try {
                    difficulty = Difficulty.valueOf(dto.getDifficulty().toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("⚠️ 알 수 없는 난이도 '{}', 기본값 LEVEL_1 사용", dto.getDifficulty());
                }
            }

            Problem problem = Problem.builder()
                    .title(dto.getTitle())
                    .description(dto.getDescription())
                    .difficulty(difficulty)
                    .orderNum(dto.getId())
                    .testCasesJson(testCasesJson)
                    .build();

            problemRepository.save(problem);
        }

        log.info("✅ 문제 {}개 로드 완료!", problemDtos.size());
    }

    @Getter
    @Setter
    static class ProblemDto {
        private int id;
        private String title;
        private String description;
        private String input;
        private String output;
        private String difficulty;
        private List<TestCase> testCases;
    }
}

package com.Loop.CodeStartUP.external;

import com.Loop.CodeStartUP.external.judge0.dto.Judge0SubmitRequest;
import com.Loop.CodeStartUP.external.judge0.dto.Judge0SubmitResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Slf4j
@Component
public class Judge0Client {

    @Value("${judge0.api-url:https://ce.judge0.com}")
    private String apiUrl; // ✅ 공식 Judge0 무료 서버

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Judge0에 코드 제출 후 즉시 결과 받기
     */
    public Judge0SubmitResponse submitAndWait(Judge0SubmitRequest request) {
        try {
            // ✅ Base64 인코딩 추가
            String encoded = Base64.getEncoder().encodeToString(request.getSourceCode().getBytes(StandardCharsets.UTF_8));
            request.setSourceCode(encoded);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Judge0SubmitRequest> entity = new HttpEntity<>(request, headers);

            log.info("🚀 Judge0 요청 본문: {}", new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request));

            ResponseEntity<Judge0SubmitResponse> response = restTemplate.postForEntity(
                    apiUrl + "/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,message,status,time,memory,token",
                    entity,
                    Judge0SubmitResponse.class
            );

            Judge0SubmitResponse body = response.getBody();
            if (body == null) throw new RuntimeException("Judge0 응답이 null입니다.");

            log.info("✅ Judge0 결과: {}", body.getStatus() != null ? body.getStatus().getDescription() : "null");
            return body;

        } catch (Exception e) {
            log.error("❌ Judge0 제출 실패", e);
            throw new RuntimeException("Judge0 제출 실패: " + e.getMessage());
        }
    }
}

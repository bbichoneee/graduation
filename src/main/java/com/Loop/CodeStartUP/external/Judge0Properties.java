package com.Loop.CodeStartUP.external;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Judge0 API 설정 프로퍼티
 * application.yml 에서 judge0.* 로 설정 가능
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "judge0")
public class Judge0Properties {
    private String apiUrl;
    private String apiKey;
}

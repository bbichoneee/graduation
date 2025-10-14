package com.Loop.CodeStartUP.external.judge0.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Judge0SubmitRequest {

    @JsonProperty("language_id")
    private Integer languageId;

    @JsonProperty("source_code")
    private String sourceCode;

    @JsonProperty("stdin")
    private String stdin;

    @JsonProperty("expected_output")
    private String expectedOutput;

    @Override
    public String toString() {
        return "Judge0SubmitRequest{" +
                "languageId=" + languageId +
                ", sourceCode='" + (sourceCode != null ? sourceCode.substring(0, Math.min(30, sourceCode.length())) + "..." : "null") + '\'' +
                ", stdin='" + stdin + '\'' +
                ", expectedOutput='" + expectedOutput + '\'' +
                '}';
    }
}

package com.Loop.CodeStartUP.domain.problem.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TestCase {

    @JsonProperty("inputData")  // ✅ JSON의 "inputData" -> inputData 필드 매핑
    private String inputData;

    private String expectedOutput;

    @JsonProperty("isSample")   // ✅ JSON의 "isSample" -> sample 필드 매핑
    private boolean sample;
}

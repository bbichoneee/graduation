package com.Loop.CodeStartUP.domain.submission;

import com.Loop.CodeStartUP.domain.submission.dto.SubmissionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/submission")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService; // ✅ 패키지 통일

    @PostMapping
    public ResponseEntity<?> submitCode(@RequestBody SubmissionRequest request) {
        Submission submission = submissionService.submit(
                request.getProblemId(),
                request.getCode(),
                request.getLanguage()
        );
        return ResponseEntity.ok(submission);
    }
}

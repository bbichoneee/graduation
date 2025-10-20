package com.Loop.CodeStartUP.domain.submission;

import com.Loop.CodeStartUP.domain.submission.dto.SubmissionRequest;
import com.Loop.CodeStartUP.domain.submission.dto.SubmissionResponse;
import com.Loop.CodeStartUP.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/submission")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<?> submitCode(
            @RequestBody SubmissionRequest request,
            @AuthenticationPrincipal User user   // ✅ 로그인된 사용자 정보 주입
    ) {
        Submission submission = submissionService.submit(
                request.getProblemId(),
                request.getCode(),
                request.getLanguage(),
                user // ✅ 서비스로 전달
        );
        return ResponseEntity.ok(new SubmissionResponse(submission));
    }
}

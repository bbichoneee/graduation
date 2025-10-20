package com.Loop.CodeStartUP.domain.daily;

import com.Loop.CodeStartUP.domain.submission.Submission;
import com.Loop.CodeStartUP.domain.user.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/daily")
public class DailyProblemController {

    private final DailyProblemService dailyProblemService;

    /** ✅ 오늘의 문제 조회 */
    @GetMapping("/today")
    public ResponseEntity<DailyProblemResponse> getTodayProblem(
            @AuthenticationPrincipal User user
    ) {
        DailyProblem daily = dailyProblemService.assignDailyProblem(user);
        return ResponseEntity.ok(new DailyProblemResponse(daily));
    }

    /** ✅ 오늘의 문제 제출 (하루 3회 제한) */
    @PostMapping("/submit")
    public ResponseEntity<?> submitDailyProblem(
            @AuthenticationPrincipal User user,
            @RequestBody DailySubmitRequest request
    ) {
        Submission submission = dailyProblemService.submitDailyProblem(
                user,
                request.getCode(),
                request.getLanguage()
        );
        return ResponseEntity.ok(submission);
    }

    /** ✅ 제출 요청 DTO */
    @Getter
    public static class DailySubmitRequest {
        private String code;
        private String language;
    }
}

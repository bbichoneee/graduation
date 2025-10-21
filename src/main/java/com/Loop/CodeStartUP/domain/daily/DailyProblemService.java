package com.Loop.CodeStartUP.domain.daily;

import com.Loop.CodeStartUP.domain.problem.Problem;
import com.Loop.CodeStartUP.domain.problem.ProblemRepository;
import com.Loop.CodeStartUP.domain.submission.Submission;
import com.Loop.CodeStartUP.domain.submission.SubmissionRepository;
import com.Loop.CodeStartUP.domain.submission.SubmissionService;
import com.Loop.CodeStartUP.domain.user.User;
import com.Loop.CodeStartUP.enums.SubmissionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DailyProblemService {

    private final DailyProblemRepository dailyRepo;
    private final ProblemRepository problemRepo;
    private final SubmissionRepository submissionRepo;
    private final SubmissionService submissionService;

    /** ✅ 오늘의 문제 조회 또는 자동 배정 */
    @Transactional
    public DailyProblem assignDailyProblem(User user) {
        LocalDate today = LocalDate.now();
        return dailyRepo.findByUserAndDate(user, today)
                .orElseGet(() -> createNewDailyProblem(user, today));
    }

    /** ✅ 커리큘럼 순서대로 새로운 문제 배정 */
    private DailyProblem createNewDailyProblem(User user, LocalDate date) {
        Problem nextProblem = problemRepo.findAll().stream()
                .sorted(Comparator.comparingInt(Problem::getOrderNum))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("문제가 없습니다."));

        DailyProblem dp = DailyProblem.builder()
                .user(user)
                .problem(nextProblem)
                .date(date)
                .status(DailyStatus.NOT_STARTED)
                .build();

        return dailyRepo.save(dp);
    }

    /** ✅ 오늘의 문제 제출 (하루 3회 제한 포함) */
    @Transactional
    public Submission submitDailyProblem(User user, String code, String language) {
        LocalDate today = LocalDate.now();

        // 오늘 배정된 데일리 문제 가져오기
        DailyProblem daily = dailyRepo.findByUserAndDate(user, today)
                .orElseThrow(() -> new IllegalStateException("오늘의 문제가 없습니다."));

        Problem problem = daily.getProblem();

        // ✅ 하루 3회 제출 제한
        long todayCount = submissionRepo.countTodaySubmissions(user, problem, LocalDate.now());

        if (todayCount >= 3) {
            throw new IllegalStateException("오늘의 문제는 하루 3회까지만 제출할 수 있습니다.");
        }

        // ✅ 제출 진행
        Submission submission = submissionService.submit(problem.getId(), code, language, user);

        // ✅ 상태 업데이트
        if (submission.getResult() == SubmissionResult.SUCCESS) {
            daily.markCompleted();       // ✅ 수정
        } else {
            daily.markInProgress();      // ✅ 수정
        }

        dailyRepo.save(daily);
        return submission;
    }
}

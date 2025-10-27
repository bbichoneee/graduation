// src/api/submission.js
import { http, ensureAccessToken } from "./http";

const normalizeLang = (lang) => String(lang || "c").toLowerCase();

/**
 * 코드 제출: POST /api/submission  (백엔드 컨트롤러와 일치)
 * - 제출 직전 AT가 없으면 1회 refresh 시도(ensureAccessToken)
 * - 여전히 없으면 로그인 만료 에러
 */
export async function submitSolution({
  problemId,
  code,
  language,
  usedMs = 0,
  sharePublic = false,
  testCases = [],
}) {
  // ✅ 제출 전에 AT 보장 (없으면 refresh 한번 시도)
  const at = await ensureAccessToken();
  if (!at) {
    // 리프레시도 실패 → 다시 로그인해야 함
    throw new Error("로그인이 만료되었습니다. 다시 로그인해 주세요.");
  }

  const payload = {
    problemId,
    code,
    language: normalizeLang(language),
    usedMs,
    sharePublic: !!sharePublic,
    testCases,
  };

  try {
    const res = await http.post("/api/submission", payload, { withCredentials: true });
    return res.data;
  } catch (err) {
    // 디버깅 로그(네트워크 탭과 맞춰보기 좋음)
    console.warn(
      "[submitSolution] FAIL",
      err?.response?.status,
      err?.config?.url,
      err?.response?.data
    );
    throw err;
  }
}

/** 제출 결과 조회: GET /api/submission/{id} */
export async function fetchSubmissionResult(submissionId) {
  // 결과 조회도 보호 API일 수 있으니 AT 보장(부담 거의 없음)
  await ensureAccessToken();
  const res = await http.get(`/api/submission/${submissionId}`, { withCredentials: true });
  return res.data;
}



// src/api/submission.js
import { http } from './http';

const normalizeLang = (lang) => String(lang || 'C').toUpperCase();

/**
 * 코드 제출
 * POST /api/submission
 * body: { problemId, code, language, sharePublic? }
 */
export async function submitSolution({ problemId, code, language, sharePublic = false }) {
  const res = await http.post('/api/submission', {
    problemId,
    code,
    language: normalizeLang(language),
    sharePublic,
  });
  return res.data; // { submissionId: ... } 등
}

/**
 * 제출 결과 조회
 * GET /api/submission/{id}
 */
export async function fetchSubmissionResult(submissionId) {
  const res = await http.get(`/api/submission/${submissionId}`);
  return res.data;
}



import { api } from './client'

// 코드 제출
export async function submitSolution({ problemId, code, language }) {
  // POST /api/submissions
  // body는 백엔드의 SubmissionRequest DTO 모양과 일치해야 함
  const res = await api.post('/submission', {
    problemId,
    code,
    language
  })
  return res.data // 예: { submissionId: 123 } 또는 즉시 결과
}

// 제출 결과 조회(비동기 채점일 경우)
export async function fetchSubmissionResult(submissionId) {
  // GET /api/submissions/{id}
  const res = await api.get(`/submissions/${submissionId}`)
  return res.data // 예: { status: 'QUEUED|RUNNING|ACCEPTED|WRONG_ANSWER', ... }
}  

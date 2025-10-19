import { api } from './client'

// 문제 목록 가져오기
export async function fetchProblems() {
  // GET /api/problems
  const res = await api.get('/problems')
  // res.data 에 실제 목록(JSON)이 들어있음
  return res.data
}

// 특정 문제 상세
export async function fetchProblemById(id) {
  // GET /api/problems/{id}
  const res = await api.get(`/problems/${id}`)
  return res.data
}


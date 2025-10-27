// src/api/problems.js
import { http } from './http';

/** 문제 목록 */
export async function fetchProblems() {
  // GET /api/problems
  const res = await http.get('/api/problems');
  return res.data;
}

/** 문제 상세 */
export async function fetchProblemById(id) {
  // GET /api/problems/{id}
  const res = await http.get(`/api/problems/${id}`);
  return res.data;
}

/** (옵션) 문제 통계 */
export async function fetchProblemStats(id) {
  // GET /api/problems/{id}/stats
  const res = await http.get(`/api/problems/${id}/stats`);
  return res.data;
}


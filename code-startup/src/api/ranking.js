// src/api/ranking.js
import { http } from "./http"; // 프로젝트에 이미 있는 공통 http 인스턴스(axios)

export async function fetchRanking() {
  const res = await http.get("/api/ranking");
  // 예상 응답: [{ id, totalScore, user: { id, username, nickname, profileImageUrl } }, ...]
  return res.data ?? [];
}

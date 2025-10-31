// src/mocks/seed.js
// 가짜 유저/제출/랭킹 데이터

export const users = [
  { id: 1, username: "alice",  nickname: "앨리스",  profileImageUrl: "/img/sample1.jpg" },
  { id: 2, username: "bruce",  nickname: "브루스",  profileImageUrl: "/img/sample2.jpg" },
  { id: 3, username: "charly", nickname: "찰리",   profileImageUrl: "/img/sample3.jpg" },
  { id: 4, username: "diana",  nickname: "다이애나" },
];

export const ranking = [
  { id: 101, user: users[1], totalScore: 3500 },
  { id: 102, user: users[0], totalScore: 3200 },
  { id: 103, user: users[2], totalScore: 2800 },
  { id: 104, user: users[3], totalScore: 1200 },
];

// 현재 로그인 유저(목업)
export const currentUserId = 2;

// 간단 제출 로그(유저별)
export const submissionsByUser = {
  1: [
    { id: "a1", problemId: 11, problemTitle: "실수의 정수 변환", points: 10, result: "AC",      submittedAt: "2025-10-01T10:10:00Z" },
    { id: "a2", problemId: 12, problemTitle: "문자열 뒤집기",     points: 20, result: "WA",      submittedAt: "2025-10-02T09:00:00Z" },
    { id: "a3", problemId: 12, problemTitle: "문자열 뒤집기",     points: 20, result: "SUCCESS", submittedAt: "2025-10-02T09:10:00Z" },
  ],
  2: [
    { id: "b1", problemId: 1,  problemTitle: "Hello CSU!",       points: 5,  result: "AC", submittedAt: "2025-10-03T12:00:00Z" },
    { id: "b2", problemId: 21, problemTitle: "약수 구하기",       points: 15, result: "WA", submittedAt: "2025-10-05T14:30:00Z" },
  ],
  3: [
    { id: "c1", problemId: 7,  problemTitle: "소수 판별",         points: 15, result: "WA", submittedAt: "2025-10-06T08:00:00Z" },
  ],
  4: [],
};

// 통계 계산 헬퍼
export function calcStats(list) {
  const solvedCount  = list.length;
  const correctCount = list.filter(r => (r.result || "").toUpperCase() === "AC" || r.result === "SUCCESS").length;
  const wrongCount   = solvedCount - correctCount;
  return { solvedCount, correctCount, wrongCount };
}

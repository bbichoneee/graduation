// src/utils/authToken.js
export function getAccessToken() {
  // 프로젝트에 맞게 키 후보를 모두 체크
  return (
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("ACCESS_TOKEN") ||
    ""
  );
}

export function authHeaders() {
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

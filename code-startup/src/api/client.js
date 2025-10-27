// src/api/client.js
// 모든 API 호출은 http.js의 공용 인스턴스를 사용합니다.
import { http } from "./http";

// 과거 코드 호환: api / default 로도 내보냅니다.
export const api = http;
export { http };
export default http;


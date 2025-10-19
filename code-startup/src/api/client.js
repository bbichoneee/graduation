import axios from 'axios'

// 환경변수 읽기 (vite는 import.meta.env 를 사용)
const base = import.meta.env.VITE_API_BASE_URL

// 공용 axios 인스턴스 생성
export const api = axios.create({
  // 프록시를 쓸 거면 baseURL은 '/api'로만 둬도 됨
  // 백엔드가 '/api' 프리픽스를 쓴다고 가정
  baseURL: '/api',
  withCredentials: false, // 쿠키 인증 필요시 켜둠 (필요 없으면 삭제)
  timeout: 10000,        // 10초 타임아웃
})

// 응답 인터셉터 (에러 메시지 통일 등)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 공통 에러 로깅
    console.error('[API ERROR]', err?.response?.status, err?.response?.data)
    return Promise.reject(err)
  }
)

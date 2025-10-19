import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// 개발 서버에서 '/api'로 오는 요청을 백엔드(8080)로 프록시
export default defineConfig({
  plugins: [react()],
  server : {
    proxy : {
      '/api' : {
        target : process.env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin : true,
      }
    }
  }
})

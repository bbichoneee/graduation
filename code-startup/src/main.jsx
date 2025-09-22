import { StrictMode } from 'react'           // React 대신 StrictMode만
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import "D:\\graduation\\code-startup\\src\\styles\\main.scss"


//bootstrap css & JS
import 'bootstrap/dist/css/bootstrap.min.css' //부트스트랩의 기본 테마 포함.
import 'bootstrap/dist/js/bootstrap.bundle.min.js' // 부트스트랩의 인터랙티브 컴포넌트 JS로드

// Project SCSS 프로젝트의 SCSS집입 파일 로드
import './styles/main.scss'

ReactDOM.createRoot(document.getElementById('root')).render(  //REACT18의 신규 마운트 방식
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

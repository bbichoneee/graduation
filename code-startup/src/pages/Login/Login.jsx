//0.로그인 페이지
import './Login.scss';

const Login = () => {
    const handleLogin = () => {
        //실제로는 여기서 로그인 검증 (api등)
        onLogin(); //로그인 성공하면 상태 바꾸기
    }

    return(
        <div className="login-page">
             {/* 왼쪽 이미지 영역 */}
            <div className="login-image">
                <img src="/img/loginpage.jpg" alt="로그인 이미지" />
            </div>

            {/* 오른쪽 로그인 폼 영역 */}
            <div className="login-form">
                <h1 className="header-title">로그인</h1>
                <button className="btn btn-primary" onClick={handleLogin}>
                로그인
                </button>
            </div>
        </div>
    ) ;
}

export default Login;
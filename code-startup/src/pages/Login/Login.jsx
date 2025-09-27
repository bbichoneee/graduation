//0.로그인 페이지
import './Login.scss';
import MyRoutes from '/src/routes.jsx';
import { Link } from 'react-router-dom';

const Login = () => {
    const handleLogin = () => {
        //실제로는 여기서 로그인 검증 (api등)
        onLogin(); //로그인 성공하면 상태 바꾸기
    }

    return(
        <div className="login_page">

            {/* 로그인 폼 영역 */}
            
            <div className="login-form">
                <div className='main_logo_box'>
                    <img className = "main_logo" src = "./img/logo.png"/>
                </div>
                <div className='login_container'>
                    <div className = "login_box">
                    <h1 className="header-title">LOGIN</h1>
                    <div className="id_box">
                        <p>ID</p>
                        <input type = "text" placeholder ="아이디를 입력하세요."></input>
                    </div>
                    <div className="pwd_box">
                        <p>PASSWORD</p>
                        <input type = "password" placeholder ="비밀번호를 입력하세요."></input>
                    </div>
                    <div className = "btn_container">
                        <Link to ="/newlogin" className = "btn btn-light">회원가입</Link>
                        <button className="btn btn-primary" onClick={handleLogin}>
                        로그인
                        </button>
                    </div>
                </div>
                </div>
                
            </div>
        </div>
    ) ;
}

export default Login;
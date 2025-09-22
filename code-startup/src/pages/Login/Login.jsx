//0.로그인 페이지

const Login = () => {
    const handleLogin = () => {
        //실제로는 여기서 로그인 검증 (api등)
        onLogin(); //로그인 성공하면 상태 바꾸기
    }

    return(
        <h1>로그인페이지</h1>
    ) ;
}

export default Login;
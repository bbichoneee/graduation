// src/pages/Login/Login.jsx  (파일 경로는 네 프로젝트 구조에 맞게)
import "./Login.scss";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../api/auth";

const Login = () => {
  const navigate = useNavigate();

  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async () => {
    if (!username || !password) return;
    setErr("");
    setLoading(true);
    try {
      const result = await login({ username, password }); // 토큰 저장 + ok 반환
      if (!result.ok) {
        setErr("토큰 저장에 실패했습니다. 응답 형식을 확인해주세요.");
        return;
      }
      // 저장 성공 → 이동
      navigate("/");
    } catch (e) {
      setErr(e?.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login_page">
      <div className="login-form">
        <div className="main_logo_box">
          <img className="main_logo" src="./img/logo.png" alt="logo" />
        </div>

        <div className="login_container">
          <div className="login_box">
            <h1 className="header-title">LOGIN</h1>

            <div className="id_box">
              <p>ID</p>
              <input
                type="text"
                placeholder="아이디를 입력하세요."
                value={username}
                onChange={(e) => setU(e.target.value)}
                autoComplete="username"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div className="pwd_box">
              <p>PASSWORD</p>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요."
                value={password}
                onChange={(e) => setP(e.target.value)}
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {err && <div className="auth-error">{err}</div>}

            <div className="btn_container">
              <Link to="/newlogin" className="btn btn-light">회원가입</Link>
              <button
                className="btn btn-primary"
                onClick={handleLogin}
                disabled={loading || !username || !password}
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

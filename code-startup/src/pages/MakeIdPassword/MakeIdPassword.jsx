//1-4. 아이디/비밀번호 생성 페이지
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './MakeIdPassword.scss'
import MyRoutes from '/src/routes.jsx';

export default function MakeIdPassword({ onSubmit }) {
    const  navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [pwd, setPwd] = useState("");
    const [pwd2, setPwd2] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);

    const [touched, setTouched] = useState({ username: false, pwd: false, pwd2: false });

    // 규칙 예시: 영문으로 시작, 영문/숫자/언더바 4~16자
    const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{3,15}$/;
    // 규칙 예시: 8~32자, 영문/숫자 각 1개 이상, 특수문자 허용
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_\-+=]{8,32}$/;

    const usernameValid = usernameRegex.test(username);
    const pwdValid = pwdRegex.test(pwd);
    const pwdMatch = pwd && pwd === pwd2;

    const isValid = usernameValid && pwdValid && pwdMatch;

    const handleSubmit = (e) => {
        e.preventDefault();
        setTouched({ username: true, pwd: true, pwd2: true });
        if (!isValid) return;
        onSubmit?.({ username, password: pwd });
        // TODO: 서버 전송/상태 저장 등
         navigate("/makefinished"); // ← 다음 페이지 경로
        };

    return(

        <div className="container">
            <div className="main_text">
                아이디와 비밀번호를 <br/> 생성하세요. 
            </div>
            <form className="submit_container custom_input" onSubmit={handleSubmit} noValidate>
                {/* 아이디 */}
                <div className="mb-3">
                    <label htmlFor="signup-username" className="form-label">아이디</label>
                    <input
                    id="signup-username"
                    type="text"
                    className={`form-control ${touched.username ? (usernameValid ? "is-valid" : "is-invalid") : ""}`}
                    placeholder="영문으로 시작, 4~16자 (영문/숫자/_)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                    autoComplete="username"
                    required
                    />
                    <div className="form-text">예: code_start, Code1234</div>
                    <div className="invalid-feedback">영문으로 시작하고 영문/숫자/_ 조합 4~16자로 입력해 주세요.</div>
                </div>

                {/* 비밀번호 */}
                <div className="mb-3">
                    <label htmlFor="signup-password" className="form-label">비밀번호</label>
                    <div className="input-group">
                    <input
                        id="signup-password"
                        type={showPwd ? "text" : "password"}
                        className={`form-control ${touched.pwd ? (pwdValid ? "is-valid" : "is-invalid") : ""}`}
                        placeholder="8~32자, 영문과 숫자 1개 이상 포함"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, pwd: true }))}
                        autoComplete="new-password"
                        required
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPwd((s) => !s)}
                        aria-label={showPwd ? "비밀번호 숨기기" : "비밀번호 보기"}
                    >
                        {showPwd ? "숨김" : "보기"}
                    </button>
                    </div>
                    <div className="invalid-feedback">8~32자이며 영문과 숫자를 최소 1개 이상 포함해야 합니다.</div>
                </div>

                {/* 비밀번호 확인 */}
                <div className="mb-3">
                    <label htmlFor="signup-password2" className="form-label">비밀번호 확인</label>
                    <div className="input-group">
                        <input
                            id="signup-password2"
                            type={showPwd2 ? "text" : "password"}
                            className={`form-control ${touched.pwd2 ? (pwdMatch ? "is-valid" : "is-invalid") : ""}`}
                            placeholder="비밀번호를 다시 입력"
                            value={pwd2}
                            onChange={(e) => setPwd2(e.target.value)}
                            onBlur={() => setTouched((t) => ({ ...t, pwd2: true }))}
                            autoComplete="new-password"
                            required
                        />
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPwd2((s) => !s)}
                            aria-label={showPwd2 ? "비밀번호 숨기기" : "비밀번호 보기"}
                        >
                            {showPwd2 ? "숨김" : "보기"}
                        </button>
                    </div>
                    <div className="invalid-feedback">비밀번호가 일치하지 않습니다.</div>
                </div>

                {/* 다음 버튼 */}
                <div className="btn_container">
                    <button 
                        type="submit" className="btn btn-primary custom_btn" 
                        disabled={!isValid}
                    >
                        다음
                        <img src="/img/arrow-forward-64.png" className="arrow" />
                    </button>
                </div>
            </form>
        </div>
    );
}


// 1-4. 아이디/비밀번호 생성 페이지
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MakeIdPassword.scss";
import { loadDraft, clearDraft } from "../../utils/signupDraft";
import { signUp, login } from "../../api/auth";

export default function MakeIdPassword() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [touched, setTouched] = useState({ username: false, pwd: false, pwd2: false });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // 규칙 예시
  const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{3,15}$/; // 영문 시작, 4~16자
  const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_\-+=]{8,32}$/; // 8~32자, 영문+숫자

  const usernameValid = usernameRegex.test(username);
  const pwdValid = pwdRegex.test(pwd);
  const pwdMatch = !!pwd && pwd === pwd2;
  const isValid = usernameValid && pwdValid && pwdMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, pwd: true, pwd2: true });
    if (!isValid) return;

    setErr("");
    setLoading(true);

    try {
      const draft = loadDraft(); // { nickname, profileImageUrl }

      // profileImageUrl은 MakeProfile에서 이미 처리되었으므로 그대로 사용
      // null 또는 빈 문자열이 올 수 있음
      const profileImageUrl = draft.profileImageUrl || null; // Ensure it's null if empty string

      let nick = (draft.nickname || "").trim();
      if (!nick || nick === "사용자" || nick.length < 2) {
        nick = `사용자_${Math.random().toString(36).slice(2, 6)}`;
      }

      const payload = {
        username: username.trim(),
        password: pwd,
        nickname: nick,
        profileImageUrl: profileImageUrl,
      };

      console.log("Sending signup payload:", payload); // Add this line

      await signUp(payload);                  // 회원가입
      await login({ username: payload.username, password: pwd }); // 자동 로그인

      clearDraft();
      navigate("/makefinished");
    } catch (e) {
      setErr(e?.message || "처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
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

        {err && <div className="auth-error">{err}</div>}

        {/* 다음 버튼 */}
        <div className="btn_container">
          <button type="submit" className="btn btn-primary custom_btn" disabled={!isValid || loading}>
            {loading ? "처리 중..." : "다음"}
            <img src="/img/arrow-forward-64.png" className="arrow" alt="" />
          </button>
        </div>
      </form>
    </div>
  );
}

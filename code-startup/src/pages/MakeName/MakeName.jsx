// 1-2. 사용자 닉네임 생성 페이지
import "./MakeName.scss";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveDraft } from "../../utils/signupDraft";

const MakeName = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const valid = nickname.trim().length >= 2 && nickname.trim().length <= 8;

  const goNext = () => {
    if (!valid) return;
    saveDraft({ nickname: nickname.trim() }); // 임시 저장
    navigate("/makeprofile");
  };

  return (
    <div className="container">
      <div className="main_text">
        사용할 닉네임을<br/>입력하세요.
      </div>

      <div className="input-group input-group-lg custom_input">
        <input
          type="text"
          className="form-control inp"
          placeholder="2~8자 한글,영어,숫자 포함"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && goNext()}
        />
        <button className="btn btn-primary custom_btn" onClick={goNext} disabled={!valid}>
          다음
          <img src="/img/arrow-forward-64.png" className="arrow" alt="" />
        </button>
      </div>
    </div>
  );
};
export default MakeName;

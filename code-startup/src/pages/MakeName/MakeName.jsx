//1-2. 사용자 닉네임 생성 페이지
import './MakeName.scss'
import MyRoutes from '/src/routes.jsx';
import {Link} from 'react-router-dom'

const MakeName = () => {
    return(
        <div className = "container">
            <div className="main_text">사용할 닉네임을<br/>입력하세요.</div>
            <div className="input-group input-group-lg custom_input">
                <input type="text" className="form-control inp" placeholder="2~8자 한글,영어,숫자 포함" ></input>
                <Link to="/makeprofile" className="btn btn-primary custom_btn">다음</Link>
            </div>
        </div>
    );
}
export default MakeName;
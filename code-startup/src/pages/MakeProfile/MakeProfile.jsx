//1-3. 프로필 사진 등록 페이지
import './MakeProfile.scss'
import MyRoutes from '/src/routes.jsx';
import {Link} from 'react-router-dom'


const MakeProfile = () => {
    return(
        <div className = "container">
            <div className="main_text">사용자 프로필 사진을<br/>등록하세요.</div>
            <div className="input-group input-group-lg custom_input">
                <input type="text" className="form-control inp" placeholder="2~8자 한글,영어,숫자 포함" ></input>
                <Link to="/makeprofile" className="btn btn-primary custom_btn">다음</Link>
            </div>
        </div>
    ) ;
}
export default MakeProfile;
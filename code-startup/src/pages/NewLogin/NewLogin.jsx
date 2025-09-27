//1-1. 회원가입 시작 페이지
import './NewLogin.scss'
import MyRoutes from '/src/routes.jsx';
import {Link} from 'react-router-dom'

const NewLogin = () => {
    return(
        <div className = "container">
            <div className="main_text">안녕하세요.<br/> 코딩을 START하고<br/> 실력을 UP 해볼까요?</div>
            <Link to="/makename" className="btn btn-primary custom_btn">회원가입
                <img src = "/img/arrow-forward-64.png" className='arrow'></img>
            </Link>
        </div>
    ) ;
}
export default NewLogin;
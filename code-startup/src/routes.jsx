import Home from './pages/Home.jsx'
import CodeChallenge from './pages/CodeChallenge'
import DailyQ from './pages/DailyQ'
import DiffProfile from './pages/DiffProfile'
import DiffSolutionList from './pages/DiffQSolutionList'
import DiffSolutionLook from './pages/DiffQSolutionLook'
import Login from './pages/Login'
import MakeFinished from './pages/MakeFinished'
import MakeName from './pages/MakeName'
import MakePassword from './pages/MakeIdPassworl'
import MakeProfile from './pages/MakeProfile'
import Mypage from './pages/MyPage'
import NewLogin from './pages/NewLogin'
import Qbank from './pages/Qbank'
import Ranking from './pages/Ranking'
import SolveQ from './pages/SolveQ'
import UserQ from './pages/UserQ'
import VulnerableQ from './pages/VulnerableQ'
import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

function ProtectedRoute({ isLoggedIn , children }) {
  if (!isLoggedIn){
    return <Navigate to="/login" replace />;//로그인이 안되어있으면 로그인 페이지로 이동
  }
  return children; //로그인 되어있으면 메인 페이지로 
}

const MyRoutes = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <Routes>
            <Route path = "/" element= {
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                    <Home/>
                </ProtectedRoute>
            } />
            <Route path = "/qbank" element= {<Qbank/>} />
            <Route path = "/userq" element= {<UserQ/>} />
            <Route path = "/codechallenge" element= {<CodeChallenge/>} />
            <Route path = "/ranking" element= {<Ranking/>} />
            <Route path = "/mypage" element= {<Mypage/>} />
            <Route path = "/dailyq" element= {<DailyQ/>} />
            <Route path = "/diffprofile" element= {<DiffProfile/>} />
            <Route path = "/diffsolutionlist" element= {<DiffSolutionList/>} />
            <Route path = "/diffsolutionlook" element= {<DiffSolutionLook/>} />
            <Route path = "/login" element= {<Login onLogin={() => setIsLoggedIn(true)} /> } />
            <Route path = "/makefinished" element= {<MakeFinished/>} />
            <Route path = "/makename" element= {<MakeName/>} />
            <Route path = "/makepassword" element= {<MakePassword/>} />
            <Route path = "/newlogin" element= {<NewLogin/>} />
            <Route path = "/solveq" element= {<SolveQ/>} />
            <Route path = "/vulnerableq" element= {<VulnerableQ/>} />
        </Routes>
    );
}




export default MyRoutes;
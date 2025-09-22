import Home from "./pages/Home/Home.jsx";
import CodeChallenge from "./pages/CodeChallenge/CodeChallenge.jsx";
import DailyQ from "./pages/DailyQ/DailyQ.jsx";
import DiffProfile from "./pages/DiffProfile/DiffProfile.jsx";
import DiffSolutionList from "./pages/DiffQSolutionList/DiffQSolutionList.jsx";
import DiffSolutionLook from "./pages/DiffQSolutionLook/DiffQSolutionLook.jsx";
import Login from "./pages/Login/Login.jsx";
import MakeFinished from "./pages/MakeFinished/MakeFinished.jsx";
import MakeName from "./pages/MakeName/MakeName.jsx";
import MakeIdPassword from "./pages/MakeIdPassword/MakeIdPassword.jsx"; 
import MakeProfile from "./pages/MakeProfile/MakeProfile.jsx";
import Mypage from "./pages/MyPage/MyPage.jsx";
import NewLogin from "./pages/NewLogin/NewLogin.jsx";
import Qbank from "./pages/Qbank/Qbank.jsx";
import Ranking from "./pages/Ranking/Ranking.jsx";
import SolveQ from "./pages/SolveQ/SolveQ.jsx";
import UserQ from "./pages/UserQ/UserQ.jsx";
import VulnerableQ from "./pages/VulnerableQ/VulnerableQ.jsx";

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
            <Route path = "/makeidpassword" element= {<MakeIdPassword/>} />
            <Route path = "/newlogin" element= {<NewLogin/>} />
            <Route path = "/solveq" element= {<SolveQ/>} />
            <Route path = "/vulnerableq" element= {<VulnerableQ/>} />
        </Routes>
    );
}




export default MyRoutes;
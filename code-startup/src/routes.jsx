// src/routes.jsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

// 페이지
import Home from "./pages/Home/Home.jsx";
import DiffProfile from "./pages/DiffProfile/DiffProfile.jsx";
import DiffQSolutionList from "./pages/DiffQSolutionList/DiffQSolutionList.jsx";
import DiffQSolutionLook from "./pages/DiffQSolutionLook/DiffQSolutionLook.jsx";
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


// 토큰 스토어 (로컬스토리지 accessToken 확인)
import { tokenStore } from "./api/http.js";

/** 보호 라우트: accessToken 이 없으면 /login 으로 보냄 */
function ProtectedRoute() {
  const at = tokenStore.getAccess();        // localStorage.getItem('accessToken')
  if (!at) return <Navigate to="/login" replace />;
  return <Outlet />;                         // 중첩 라우트 렌더
}

const MyRoutes = () => {
  return (
    <Routes>
      {/* 공개 라우트(인증 불필요) */}
      <Route path="/login" element={<Login />} />
      <Route path="/newlogin" element={<NewLogin />} />
      {/* 회원가입 단계 페이지들도 공개로 두는 게 일반적 */}
      <Route path="/makename" element={<MakeName />} />
      <Route path="/makeidpassword" element={<MakeIdPassword />} />
      <Route path="/makeprofile" element={<MakeProfile />} />
      <Route path="/makefinished" element={<MakeFinished />} />

      {/* 보호 라우트(인증 필요) 묶음 */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/qbank" element={<Qbank />} />
        <Route path="/userq" element={<UserQ />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/mypage" element={<Mypage />} />
        <Route path="/diffprofile" element={<DiffProfile />} />
        <Route path="/diffqsolutionlist" element={<DiffQSolutionList />} />
        <Route path="/diffqsolutionlook" element={<DiffQSolutionLook />} />
        <Route path="/solveq/:id" element={<SolveQ />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default MyRoutes;

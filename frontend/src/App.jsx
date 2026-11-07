import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import SignupCompletePage from "./pages/auth/SignupCompletePage";
import ProjectListPage from "./pages/project/ProjectListPage";
import ProjectFormPage from "./pages/project/ProjectFormPage";
import ProjectDetailPage from "./pages/project/ProjectDetailPage";
import ProjectManagePage from "./pages/project/ProjectManagePage";
import QuestionListPage from "./pages/question/QuestionListPage";
import QuestionFormPage from "./pages/question/QuestionFormPage";
import QuestionDetailPage from "./pages/question/QuestionDetailPage";
import MemberList from "./pages/member/MemberListPage";
import MemberDetail from "./pages/member/MemberDetailPage";
import InboxPage from "./pages/inbox/InboxPage";
import MyPage from "./pages/mypage/MyPage";
import AdminPage from "./pages/admin/AdminPage";
import ErrorPage from "./pages/ErrorPage";

function App() {
  return (
    <Routes>
      {/* 메인 */}
      <Route path="/" element={<HomePage />} />

      {/* 회원 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/signup/complete" element={<SignupCompletePage />} />

      {/* 모집 글 */}
      <Route path="/projects" element={<ProjectListPage />} />
      <Route path="/projects/new" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} /> 
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} /> 
      <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
      <Route path="/projects/:id/manage" element={<ProtectedRoute><ProjectManagePage /></ProtectedRoute>} /> 


      {/* 질문 */}
      <Route path="/questions" element={<QuestionListPage />} />
      <Route path="/questions/new" element={<ProtectedRoute><QuestionFormPage /></ProtectedRoute>} />
      <Route path="/questions/:id" element={<ProtectedRoute><QuestionDetailPage /></ProtectedRoute>} />
      <Route path="/questions/:id/edit" element={<ProtectedRoute><QuestionFormPage /></ProtectedRoute>} />

      {/* 팀원 찾기 */}
      <Route path="/members" element={<ProtectedRoute><MemberList /></ProtectedRoute>} />
      <Route path="/members/:id" element={<ProtectedRoute><MemberDetail /></ProtectedRoute>} />

      {/* 요청함 (?tab=received / sent) */}
      <Route path="/requests" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />

      {/* 마이페이지 */}
      <Route path="/mypage" element={<Navigate to="/mypage/profile" replace />} />
      <Route path="/mypage/profile" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/mypage/teams" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/mypage/projects" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />

      {/* 관리자 */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="/admin/qna" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

      {/* 없는 주소 */}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default App;
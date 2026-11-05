import { Routes, Route, Navigate } from "react-router-dom";

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
import MemberListPage from "./pages/member/MemberListPage";
import MemberDetailPage from "./pages/member/MemberDetailPage";
import InboxPage from "./pages/inbox/InboxPage";
import MyPage from "./pages/mypage/MyPage";
import AdminPage from "./pages/admin/AdminPage";
import ErrorPage from "./pages/ErrorPage";

function App() {
  return (
    <Routes>
      {/* SCR-03 메인 */}
      <Route path="/" element={<HomePage />} />

      {/* SCR-04~06 회원 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/signup/complete" element={<SignupCompletePage />} />

      {/* SCR-07~10 모집 글 */}
      <Route path="/projects" element={<ProjectListPage />} />
      <Route path="/projects/new" element={<ProjectFormPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
      <Route path="/projects/:id/manage" element={<ProjectManagePage />} />

      {/* SCR-11~13 질문 */}
      <Route path="/questions" element={<QuestionListPage />} />
      <Route path="/questions/new" element={<QuestionFormPage />} />
      <Route path="/questions/:id" element={<QuestionDetailPage />} />
      <Route path="/questions/:id/edit" element={<QuestionFormPage />} />

      {/* SCR-14~15 팀원 찾기 */}
      <Route path="/members" element={<MemberListPage />} />
      <Route path="/members/:id" element={<MemberDetailPage />} />

      {/* SCR-16 요청함 (?tab=received / sent) */}
      <Route path="/requests" element={<InboxPage />} />

      {/* SCR-17~19 마이페이지 */}
      <Route path="/mypage" element={<Navigate to="/mypage/profile" replace />} />
      <Route path="/mypage/profile" element={<MyPage />} />
      <Route path="/mypage/teams" element={<MyPage />} />
      <Route path="/mypage/projects" element={<MyPage />} />

      {/* SCR-20~23 관리자 */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/users" element={<AdminPage />} />
      <Route path="/admin/projects" element={<AdminPage />} />
      <Route path="/admin/qna" element={<AdminPage />} />
      <Route path="/admin/reports" element={<AdminPage />} />

      {/* SCR-24 없는 주소 */}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default App;
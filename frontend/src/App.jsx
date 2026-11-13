import { Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/common/Header";
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
import AnswerPreviewPage from "./pages/AnswerPreviewPage";
import ProjectApplyPreviewPage from "./pages/ProjectApplyPreviewPage";
import MemberListPage from "./pages/member/MemberListPage";
import MemberDetailPage from "./pages/member/MemberDetailPage";
import InboxPage from "./pages/inbox/InboxPage";
import MyPage from "./pages/mypage/MyPage";
import AdminPage from "./pages/admin/AdminPage";
import ErrorPage from "./pages/ErrorPage";

function App() {
  return (
    <>
      <Header />
      <Routes>
        {import.meta.env.DEV && (
          <>
            <Route path="/dev/answers" element={<AnswerPreviewPage />} />
            <Route path="/dev/project-apply" element={<ProjectApplyPreviewPage />} />
          </>
        )}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/complete" element={<SignupCompletePage />} />

        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/new" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
        <Route path="/projects/:id/manage" element={<ProtectedRoute><ProjectManagePage /></ProtectedRoute>} />

        <Route path="/questions" element={<QuestionListPage />} />
        <Route path="/questions/new" element={<ProtectedRoute><QuestionFormPage /></ProtectedRoute>} />
        <Route path="/questions/:id" element={<ProtectedRoute><QuestionDetailPage /></ProtectedRoute>} />
        <Route path="/questions/:id/edit" element={<ProtectedRoute><QuestionFormPage /></ProtectedRoute>} />

        <Route path="/members" element={<ProtectedRoute><MemberListPage /></ProtectedRoute>} />
        <Route path="/members/:id" element={<ProtectedRoute><MemberDetailPage /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
        <Route path="/mypage" element={<Navigate to="/mypage/profile" replace />} />
        <Route path="/mypage/profile" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
        <Route path="/mypage/teams" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
        <Route path="/mypage/projects" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/projects" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/qna" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </>
  );
}

export default App;

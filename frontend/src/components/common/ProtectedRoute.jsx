// 로그인이 필요한 페이지를 감싸는 컴포넌트

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function ProtectedRoute({ children, adminOnly }) {
  const { user, isLoggedIn, loading } = useAuth();
  const location = useLocation();

  // 1. 새로고침 직후 내 정보 확인중일 때
  if (loading) {
    return null;
  }

  // 2. 로그인 안 했으면 로그인 화면으로 (원래 주소를 state로 전달)
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  // 3. 관리자 전용인데 관리자가 아니면 메인으로
  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // 4. 통과하면 감싼 페이지를 보여줌
  return children;
}

export { ProtectedRoute };
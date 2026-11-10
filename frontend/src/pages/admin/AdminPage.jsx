// SCR-20~23 관리자 화면 틀: 왼쪽 메뉴 + 주소에 맞는 관리 화면 (김정훈)
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { getAdminReports } from "../../api/admin";
import AdminProjectsPage from "./AdminProjectsPage";
import AdminQnaPage from "./AdminQnaPage";
import AdminUsersPage from "./AdminUsersPage";
import "./AdminPage.css";

// 메뉴와 화면 (아직 만들지 않은 화면은 page: null → 준비 중 표시)
const MENUS = [
  { path: "/admin/users", label: "회원 관리", page: AdminUsersPage },
  { path: "/admin/projects", label: "모집 글 관리", page: AdminProjectsPage },
  { path: "/admin/qna", label: "질문 · 답변 관리", page: AdminQnaPage },
  { path: "/admin/reports", label: "신고된 게시물", page: null },
];

function AdminPage() {
  const location = useLocation();
  const [pendingReportCount, setPendingReportCount] = useState(0);

  // 신고된 게시물 메뉴 배지: 처리 대기 대상 수 (메뉴를 옮길 때마다 새로 확인)
  useEffect(() => {
    let ignore = false;

    getAdminReports({ status: "PENDING", page: 1, size: 1 })
      .then((response) => {
        if (!ignore) {
          setPendingReportCount(Number(response.data.data.totalCount) || 0);
        }
      })
      .catch(() => {
        // 배지는 보조 정보라 실패해도 화면은 그대로 사용
      });

    return () => {
      ignore = true;
    };
  }, [location.pathname]);

  // /admin 으로 들어오면 회원 관리로
  if (location.pathname === "/admin") {
    return <Navigate to="/admin/users" replace />;
  }

  const current = MENUS.find((menu) => menu.path === location.pathname);
  const CurrentPage = current?.page;

  return (
    <main className="admin-page">
      <div className="admin-page__layout">
        <aside className="admin-side">
          <nav className="admin-side__menu" aria-label="관리자 메뉴">
            {MENUS.map((menu) => (
              <Link
                key={menu.path}
                to={menu.path}
                className={
                  menu.path === location.pathname
                    ? "admin-side__link admin-side__link--active"
                    : "admin-side__link"
                }
                aria-current={
                  menu.path === location.pathname ? "page" : undefined
                }
              >
                {menu.label}
                {menu.path === "/admin/reports" && pendingReportCount > 0 && (
                  <span className="admin-side__count">
                    {pendingReportCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {CurrentPage ? (
          <CurrentPage />
        ) : (
          <section className="admin-content">
            <p className="admin-content__desc">준비 중인 화면입니다.</p>
          </section>
        )}
      </div>
    </main>
  );
}

export default AdminPage;

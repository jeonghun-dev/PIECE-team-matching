// SCR-21 관리자 - 모집 글 관리 (김정훈)
import { useState } from "react";
import { Link } from "react-router-dom";
import { deleteAdminProject, getAdminProjects } from "../../api/admin";
import {
  AdminPagination,
  AdminSearch,
  AdminTableState,
  AdminTabs,
} from "./AdminUI";
import {
  ADMIN_PAGE_SIZE,
  formatDate,
  getErrorMessage,
  useAdminList,
} from "./adminUtils";

const TABS = [
  { value: "ALL", label: "전체" },
  { value: "OPEN", label: "모집중" },
  { value: "CLOSED", label: "모집완료" },
];

const COLUMN_COUNT = 7;

// 탭/검색어/페이지로 모집 글 목록 불러오기
const loadProjects = async ({ tab, keyword, page }) => {
  const response = await getAdminProjects({
    status: tab === "ALL" ? undefined : tab,
    keyword: keyword || undefined,
    page,
    size: ADMIN_PAGE_SIZE,
  });
  return response.data.data;
};

function AdminProjectsPage() {
  const list = useAdminList(loadProjects, "ALL");
  const [actionId, setActionId] = useState(null);

  // 모집 글 삭제
  const handleDelete = async (project) => {
    if (actionId) {
      return;
    }

    const message = `'${project.title}' 모집 글을 삭제할까요?\n삭제한 글은 목록과 상세에서 보이지 않습니다.`;

    if (!window.confirm(message)) {
      return;
    }

    setActionId(project.id);

    try {
      await deleteAdminProject(project.id);
      list.reloadAfterDelete();
    } catch (error) {
      window.alert(
        getErrorMessage(
          error,
          "모집 글을 삭제하지 못했습니다. 다시 시도해 주세요.",
        ),
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="admin-content" aria-labelledby="admin-projects-title">
      <div className="admin-content__head">
        <h1 id="admin-projects-title" className="admin-content__title">
          모집 글 관리
        </h1>
        <p className="admin-content__desc">
          부적절한 모집 글을 확인하고 삭제할 수 있어요
        </p>
      </div>

      <div className="admin-toolbar">
        <AdminTabs tabs={TABS} value={list.tab} onChange={list.changeTab} />
        <AdminSearch
          value={list.keyword}
          onChange={list.setKeyword}
          onSubmit={list.submitSearch}
          placeholder="제목 · 작성자 검색"
        />
      </div>

      <div className="admin-table__wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">제목</th>
              <th scope="col">작성자</th>
              <th scope="col">상태</th>
              <th scope="col">마감일</th>
              <th scope="col">작성일</th>
              <th scope="col">신고</th>
              <th scope="col" className="admin-table__actions-head">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            <AdminTableState
              loading={list.loading}
              error={list.error}
              empty={list.items.length === 0}
              colSpan={COLUMN_COUNT}
              emptyText="조건에 맞는 모집 글이 없습니다."
              onRetry={list.reload}
            />
            {!list.loading &&
              !list.error &&
              list.items.map((project) => (
                <tr key={project.id}>
                  <td className="admin-table__title">
                    <span className="admin-table__strong">{project.title}</span>
                  </td>
                  <td className="admin-table__muted">
                    {project.authorNickname}
                  </td>
                  <td>
                    <span
                      className={
                        project.status === "OPEN"
                          ? "admin-badge admin-badge--primary"
                          : "admin-badge admin-badge--muted"
                      }
                    >
                      {project.status === "OPEN" ? "모집중" : "모집완료"}
                    </span>
                  </td>
                  <td className="admin-table__muted">
                    {formatDate(project.deadline)}
                  </td>
                  <td className="admin-table__muted">
                    {formatDate(project.createdAt)}
                  </td>
                  <td
                    className={
                      project.pendingReportCount > 0
                        ? "admin-table__danger"
                        : "admin-table__muted"
                    }
                  >
                    {project.pendingReportCount}건
                  </td>
                  <td className="admin-table__actions">
                    <Link
                      to={`/projects/${project.id}`}
                      className="admin-button"
                    >
                      보기
                    </Link>
                    <button
                      type="button"
                      className="admin-button admin-button--danger"
                      disabled={actionId !== null}
                      onClick={() => handleDelete(project)}
                    >
                      {actionId === project.id ? "삭제 중..." : "삭제"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={list.page}
        totalPages={list.totalPages}
        onChange={list.setPage}
      />
    </section>
  );
}

export default AdminProjectsPage;

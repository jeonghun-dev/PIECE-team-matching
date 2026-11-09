// SCR-20 관리자 - 회원 관리 (김정훈)
import { useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUsers, suspendUser, unsuspendUser } from "../../api/admin";
import {
  AdminPagination,
  AdminSearch,
  AdminTableState,
  AdminTabs,
} from "./AdminUI";
import {
  ADMIN_PAGE_SIZE,
  formatDate,
  formatScore,
  getErrorMessage,
  useAdminList,
} from "./adminUtils";

const TABS = [
  { value: "ALL", label: "전체" },
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
];

const COLUMN_COUNT = 7;

// 탭/검색어/페이지로 회원 목록 불러오기 (컴포넌트 밖에 두어 랜더마다 새로 만들지 않음)
const loadUsers = async ({ tab, keyword, page }) => {
  const response = await getAdminUsers({
    status: tab === "ALL" ? undefined : tab,
    keyword: keyword || undefined,
    page,
    size: ADMIN_PAGE_SIZE,
  });
  return response.data.data;
};

function AdminUsersPage() {
  const list = useAdminList(loadUsers, "ALL");
  const [actionId, setActionId] = useState(null);

  // 활동 정지 / 정지 해제
  const handleStatusChange = async (user) => {
    if (actionId) {
      return;
    }

    const willSuspend = user.status === "ACTIVE";
    const message = willSuspend
      ? `'${user.nickname}' 회원의 활동을 정지할까요?\n정지되면 로그인과 모든 기능 사용이 막힙니다.`
      : `'${user.nickname}' 회원의 활동 정지를 해제할까요?`;

    if (!window.confirm(message)) {
      return;
    }

    setActionId(user.id);

    try {
      if (willSuspend) {
        await suspendUser(user.id);
      } else {
        await unsuspendUser(user.id);
      }
      list.reload();
    } catch (error) {
      window.alert(
        getErrorMessage(
          error,
          "회원 상태를 변경하지 못했습니다. 다시 시도해 주세요.",
        ),
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="admin-content" aria-labelledby="admin-users-title">
      <div className="admin-content__head">
        <h1 id="admin-users-title" className="admin-content__title">
          회원 관리
        </h1>
        <p className="admin-content__desc">
          부적절한 활동을 한 회원을 정지하거나 해제할 수 있어요
        </p>
      </div>

      <div className="admin-toolbar">
        <AdminTabs tabs={TABS} value={list.tab} onChange={list.changeTab} />
        <AdminSearch
          value={list.keyword}
          onChange={list.setKeyword}
          onSubmit={list.submitSearch}
          placeholder="닉네임 · 이메일 검색"
        />
      </div>

      <div className="admin-table__wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">회원</th>
              <th scope="col">이메일</th>
              <th scope="col">레벨</th>
              <th scope="col">가입일</th>
              <th scope="col">신고</th>
              <th scope="col">상태</th>
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
              emptyText="조건에 맞는 회원이 없습니다."
              onRetry={list.reload}
            />
            {!list.loading &&
              !list.error &&
              list.items.map((user) => (
                <tr key={user.id}>
                  <td className="admin-table__strong">{user.nickname}</td>
                  <td className="admin-table__muted">{user.email}</td>
                  <td>
                    <span
                      className={`admin-level admin-level--${String(user.level).toLowerCase()}`}
                    >
                      {user.level} · {formatScore(user.totalScore)}
                    </span>
                  </td>
                  <td className="admin-table__muted">
                    {formatDate(user.createdAt)}
                  </td>
                  <td
                    className={
                      user.reportCount > 0
                        ? "admin-table__danger"
                        : "admin-table__muted"
                    }
                  >
                    {user.reportCount}건
                  </td>
                  <td>
                    <span
                      className={
                        user.status === "ACTIVE"
                          ? "admin-badge admin-badge--success"
                          : "admin-badge admin-badge--danger"
                      }
                    >
                      {user.status === "ACTIVE" ? "정상" : "정지"}
                    </span>
                  </td>
                  <td className="admin-table__actions">
                    {user.role === "ADMIN" ? (
                      <span className="admin-table__muted">관리자</span>
                    ) : (
                      <>
                        <Link
                          to={`/members/${user.id}`}
                          className="admin-button"
                        >
                          활동 내역
                        </Link>
                        <button
                          type="button"
                          className={
                            user.status === "ACTIVE"
                              ? "admin-button admin-button--danger"
                              : "admin-button"
                          }
                          disabled={actionId !== null}
                          onClick={() => handleStatusChange(user)}
                        >
                          {actionId === user.id
                            ? "처리 중…"
                            : user.status === "ACTIVE"
                              ? "활동 정지"
                              : "정지 해제"}
                        </button>
                      </>
                    )}
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

export default AdminUsersPage;

// SCR-22 관리자 - 질문/답변 관리 (김정훈)
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteAdminAnswer,
  deleteAdminQuestion,
  getAdminQna,
} from "../../api/admin";
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
  { value: "QUESTION", label: "질문" },
  { value: "ANSWER", label: "답변" },
];

const COLUMN_COUNT = 7;

// 탭마다 응답 모양이 조금 달라서 화면에서 쓰는 한 가지 모양으로 맞춤
// - 전체: type 있음, 답변의 title은 답변 내용 앞부분
// - 질문: type 없음
// - 답변: type 없음, contentPreview + questionTitle
const toRow = (item, tab) => {
  const type = item.type ?? tab;
  const isQuestion = type === "QUESTION";

  return {
    key: `${type}-${item.id}`,
    type,
    id: item.id,
    questionId: isQuestion ? item.id : item.questionId,
    // 모집 글에 달린 질문이면 모집 글 번호, 질문 게시판 글이면 null
    projectId: item.projectId ?? null,
    content: isQuestion ? item.title : (item.contentPreview ?? item.title),
    questionTitle: item.questionTitle ?? "",
    authorNickname: item.authorNickname,
    createdAt: item.createdAt,
    isSolved: item.isSolved,
    isAccepted: item.isAccepted,
    pendingReportCount: item.pendingReportCount,
  };
};

// 탭/검색어/페이지로 질문 답변 목록 불러오기
const loadQna = async ({ tab, keyword, page }) => {
  const response = await getAdminQna({
    type: tab,
    keyword: keyword || undefined,
    page,
    size: ADMIN_PAGE_SIZE,
  });
  const data = response.data.data;
  return { ...data, items: data.items.map((item) => toRow(item, tab)) };
};

// 보기 이동: 모집 글 질문은 질문 게시판에 없어서 모집 글 상세로
const viewPath = (row) =>
  row.projectId
    ? `/projects/${row.projectId}`
    : `/questions/${row.questionId}`;

// 상태 배지: 질문은 해결 여부, 답변은 채택 여부 (모집 글 질문은 해결 상태를 쓰지 않음)
function QnaStatus({ row }) {
  if (row.type === "QUESTION" && row.projectId) {
    return <span className="admin-table__muted">-</span>;
  }

  if (row.type === "QUESTION") {
    return row.isSolved ? (
      <span className="admin-badge admin-badge--success">해결</span>
    ) : (
      <span className="admin-badge admin-badge--warning">미해결</span>
    );
  }

  return row.isAccepted ? (
    <span className="admin-badge admin-badge--success">채택</span>
  ) : (
    <span className="admin-table__muted">-</span>
  );
}

function AdminQnaPage() {
  const list = useAdminList(loadQna, "ALL");
  const [actionKey, setActionKey] = useState(null);

  // 질문 또는 답변 삭제
  const handleDelete = async (row) => {
    if (actionKey) {
      return;
    }

    let message = "이 답변을 삭제할까요?";
    if (row.type === "QUESTION") {
      message = `'${row.content}' 질문을 삭제할까요?\n달린 답변도 함께 보이지 않게 됩니다.`;
    } else if (row.isAccepted) {
      message =
        "채택된 답변입니다. 삭제할까요?\n삭제하면 채택이 해제되고 질문은 미해결로 돌아갑니다.";
    }

    if (!window.confirm(message)) {
      return;
    }

    setActionKey(row.key);

    try {
      if (row.type === "QUESTION") {
        await deleteAdminQuestion(row.id);
      } else {
        await deleteAdminAnswer(row.id);
      }
      list.reloadAfterDelete();
    } catch (error) {
      window.alert(
        getErrorMessage(error, "삭제하지 못했습니다. 다시 시도해 주세요."),
      );
    } finally {
      setActionKey(null);
    }
  };

  return (
    <section className="admin-content" aria-labelledby="admin-qna-title">
      <div className="admin-content__head">
        <h1 id="admin-qna-title" className="admin-content__title">
          질문 · 답변 관리
        </h1>
        <p className="admin-content__desc">
          부적절한 질문과 답변을 확인하고 삭제할 수 있어요
        </p>
      </div>

      <div className="admin-toolbar">
        <AdminTabs tabs={TABS} value={list.tab} onChange={list.changeTab} />
        <AdminSearch
          value={list.keyword}
          onChange={list.setKeyword}
          onSubmit={list.submitSearch}
          placeholder="내용 · 작성자 검색"
        />
      </div>

      <div className="admin-table__wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">구분</th>
              <th scope="col">내용</th>
              <th scope="col">작성자</th>
              <th scope="col">작성일</th>
              <th scope="col">상태</th>
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
              emptyText="조건에 맞는 질문 · 답변이 없습니다."
              onRetry={list.reload}
            />
            {!list.loading &&
              !list.error &&
              list.items.map((row) => (
                <tr key={row.key}>
                  <td>
                    <span
                      className={
                        row.type === "QUESTION"
                          ? "admin-badge admin-badge--primary"
                          : "admin-badge admin-badge--muted"
                      }
                    >
                      {row.type === "QUESTION" ? "질문" : "답변"}
                    </span>
                  </td>
                  <td className="admin-table__title">
                    <span className="admin-table__strong">{row.content}</span>
                    {row.questionTitle && (
                      <span className="admin-table__sub">
                        질문: {row.questionTitle}
                      </span>
                    )}
                    {row.type === "QUESTION" && row.projectId && (
                      <span className="admin-table__sub">모집 글 질문</span>
                    )}
                  </td>
                  <td className="admin-table__muted">{row.authorNickname}</td>
                  <td className="admin-table__muted">
                    {formatDate(row.createdAt)}
                  </td>
                  <td>
                    <QnaStatus row={row} />
                  </td>
                  <td
                    className={
                      row.pendingReportCount > 0
                        ? "admin-table__danger"
                        : "admin-table__muted"
                    }
                  >
                    {row.pendingReportCount}건
                  </td>
                  <td className="admin-table__actions">
                    <Link
                      to={viewPath(row)}
                      className="admin-button"
                    >
                      보기
                    </Link>
                    <button
                      type="button"
                      className="admin-button admin-button--danger"
                      disabled={actionKey !== null}
                      onClick={() => handleDelete(row)}
                    >
                      {actionKey === row.key ? "삭제 중..." : "삭제"}
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

export default AdminQnaPage;

// SCR-23 관리자 - 신고된 게시물 (김정훈)
import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteAdminAnswer,
  deleteAdminProject,
  deleteAdminQuestion,
  getAdminReportDetail,
  getAdminReports,
  resolveAdminReport,
  suspendUser,
} from "../../api/admin";
import { REPORT_REASON_OPTIONS } from "../../constants";
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
  { value: "PENDING", label: "처리 대기" },
  { value: "DONE", label: "처리 완료" },
  { value: "ALL", label: "전체" },
];

const COLUMN_COUNT = 8;
const TARGET_LABEL = { PROJECT: "모집 글", QUESTION: "질문", ANSWER: "답변" };
const STATUS_BADGE = {
  PENDING: { label: "처리 대기", className: "admin-badge--warning" },
  RESOLVED: { label: "조치 완료", className: "admin-badge--success" },
  REJECTED: { label: "반려", className: "admin-badge--muted" },
};

// 사유 코드 -> 화면 문구 (ABUSE -> 욕설)
const REASON_LABEL = Object.fromEntries(
  REPORT_REASON_OPTIONS.map((option) => [option.code, option.label]),
);

const reasonText = (reasons) =>
  reasons.map((reason) => REASON_LABEL[reason] ?? reason).join(", ");

// 신고 대상 원문 주소 (답변은 달린 질문 상세로)
const targetPath = (item) => {
  if (item.targetType === "PROJECT") return `/projects/${item.targetId}`;
  if (item.targetType === "QUESTION") return `/questions/${item.targetId}`;
  return `/questions/${item.answerQuestionId}`;
};

// 대상 종류에 맞는 삭제 API
const deleteTarget = (item) => {
  if (item.targetType === "PROJECT") return deleteAdminProject(item.targetId);
  if (item.targetType === "QUESTION") return deleteAdminQuestion(item.targetId);
  return deleteAdminAnswer(item.targetId);
};

// 탭/검색어/페이지로 신고 대상 목록 불러오기
const loadReports = async ({ tab, keyword, page }) => {
  const response = await getAdminReports({
    status: tab === "ALL" ? undefined : tab,
    keyword: keyword || undefined,
    page,
    size: ADMIN_PAGE_SIZE,
  });
  return response.data.data;
};

// 펼친 줄: 이 대상에 들어온 신고 하나하나 (신고자·사유·상세 내용)
function ReportDetail({ item }) {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    getAdminReportDetail(item.targetType, item.targetId)
      .then((response) => {
        if (!ignore) {
          setReports(response.data.data.reports);
        }
      })
      .catch((requestError) => {
        if (!ignore) {
          setError(
            getErrorMessage(requestError, "신고 내역을 불러오지 못했습니다."),
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [item.targetType, item.targetId]);

  if (error) {
    return <p className="admin-report__message">{error}</p>;
  }
  if (reports === null) {
    return <p className="admin-report__message">불러오는 중입니다...</p>;
  }

  return (
    <ul className="admin-report__list">
      {reports.map((report) => (
        <li key={report.id} className="admin-report__item">
          <div className="admin-report__meta">
            <strong>{report.reporterNickname}</strong>
            <span>{REASON_LABEL[report.reason] ?? report.reason}</span>
            <span>{formatDate(report.createdAt)}</span>
            <span
              className={`admin-badge ${STATUS_BADGE[report.status].className}`}
            >
              {STATUS_BADGE[report.status].label}
            </span>
          </div>
          {report.detail && (
            <p className="admin-report__detail">{report.detail}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function AdminReportsPage({ onReportsChange }) {
  const list = useAdminList(loadReports, "PENDING");
  const [openKey, setOpenKey] = useState(null);
  const [actionKey, setActionKey] = useState(null);

  const keyOf = (item) => `${item.targetType}-${item.targetId}`;

  // 처리 3가지: 글 삭제/계정 정지/반려
  // 글 삭제/계정 정리는 해당 API를 먼저 부르고, 성공하면 신고를 조치 완료로 마무리
  const handleAction = async (item, action) => {
    if (actionKey) {
      return;
    }

    const name = TARGET_LABEL[item.targetType];
    const messages = {
      delete: item.targetDeleted
        ? `이미 삭제된 ${name}입니다. 신고를 조치 완료로 처리할까요?`
        : `이 ${name}을(를) 삭제하고 신고를 조치 완료로 처리할까요?`,
      suspend:
        item.targetAuthorStatus === "SUSPENDED"
          ? `'${item.targetAuthorNickname}' 회원은 이미 정지 상태입니다. 신고를 조치 완료로 처리할까요?`
          : `'${item.targetAuthorNickname}' 회원을 활동 정지하고 신고를 조치 완료로 처리할까요?`,
      reject: "문제가 없는 글로 보고 신고를 반려할까요?",
    };

    if (!window.confirm(messages[action])) {
      return;
    }

    setActionKey(keyOf(item));

    try {
      if (action === "delete" && !item.targetDeleted) {
        await deleteTarget(item);
      }
      if (action === "suspend" && item.targetAuthorStatus !== "SUSPENDED") {
        await suspendUser(item.targetAuthorId);
      }

      await resolveAdminReport(
        item.targetType,
        item.targetId,
        action === "reject" ? "REJECTED" : "RESOLVED",
      );

      setOpenKey(null);
      list.reloadAfterDelete();
      onReportsChange?.();
    } catch (error) {
      window.alert(
        getErrorMessage(error, "처리하지 못했습니다. 다시 시도해 주세요."),
      );
      list.reload();
    } finally {
      setActionKey(null);
    }
  };

  return (
    <section className="admin-content" aria-labelledby="admin-reports-title">
      <div className="admin-content__head">
        <h1 id="admin-reports-title" className="admin-content__title">
          신고된 게시물
        </h1>
        <p className="admin-content__desc">
          신고 내용을 확인하고 글 삭제, 계정 정지, 반려 중 하나로 처리해요
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
              <th scope="col">대상</th>
              <th scope="col">내용</th>
              <th scope="col">작성자</th>
              <th scope="col">사유</th>
              <th scope="col">신고</th>
              <th scope="col">최근 신고</th>
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
              emptyText="조건에 맞는 신고가 없습니다."
              onRetry={list.reload}
            />
            {!list.loading &&
              !list.error &&
              list.items.map((item) => {
                const key = keyOf(item);
                const isOpen = openKey === key;
                const isPending = item.status === "PENDING";
                const badge = STATUS_BADGE[item.status];

                return (
                  <Fragment key={key}>
                    <tr>
                      <td>
                        <span className="admin-badge admin-badge--primary">
                          {TARGET_LABEL[item.targetType]}
                        </span>
                      </td>
                      <td className="admin-table__title">
                        <span className="admin-table__strong">
                          {item.targetPreview}
                        </span>
                        {item.targetDeleted && (
                          <span className="admin-table__sub">삭제된 글</span>
                        )}
                      </td>
                      <td className="admin-table__muted">
                        {item.targetAuthorNickname}
                        {item.targetAuthorStatus === "SUSPENDED" && (
                          <span className="admin-badge admin-badge--danger admin-report__suspended">
                            정지
                          </span>
                        )}
                      </td>
                      <td className="admin-table__muted">
                        {reasonText(item.reasons)}
                      </td>
                      <td
                        className={
                          isPending
                            ? "admin-table__danger"
                            : "admin-table__muted"
                        }
                      >
                        {isPending
                          ? `${item.pendingCount}건 대기`
                          : `${item.reportCount}건`}
                      </td>
                      <td className="admin-table__muted">
                        {formatDate(item.lastReportedAt)}
                      </td>
                      <td>
                        <span className={`admin-badge ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="admin-table__actions">
                        <button
                          type="button"
                          className="admin-button"
                          aria-expanded={isOpen}
                          onClick={() => setOpenKey(isOpen ? null : key)}
                        >
                          {isOpen ? "닫기" : "보기"}
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="admin-report__row">
                        <td colSpan={COLUMN_COUNT}>
                          <div className="admin-report">
                            <div className="admin-report__head">
                              <strong>신고 내역 {item.reportCount}건</strong>
                              {!item.targetDeleted && (
                                <Link
                                  to={targetPath(item)}
                                  className="admin-report__link"
                                >
                                  원문 보기
                                </Link>
                              )}
                            </div>

                            <ReportDetail item={item} />

                            {isPending && (
                              <div className="admin-report__actions">
                                <button
                                  type="button"
                                  className="admin-button admin-button--danger"
                                  disabled={actionKey !== null}
                                  onClick={() => handleAction(item, "delete")}
                                >
                                  글 삭제
                                </button>
                                <button
                                  type="button"
                                  className="admin-button admin-button--danger"
                                  disabled={
                                    actionKey !== null ||
                                    item.targetAuthorId == null
                                  }
                                  onClick={() => handleAction(item, "suspend")}
                                >
                                  계정 정지
                                </button>
                                <button
                                  type="button"
                                  className="admin-button"
                                  disabled={actionKey !== null}
                                  onClick={() => handleAction(item, "reject")}
                                >
                                  반려
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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

export default AdminReportsPage;

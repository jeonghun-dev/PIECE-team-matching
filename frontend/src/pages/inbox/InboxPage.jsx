import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  acceptRequest,
  cancelRequest,
  getPendingRequestCount,
  getRequests,
  notifyRequestsUpdated,
  rejectRequest,
} from "../../api/requests";
import {
  REQUEST_STATUS,
  REQUEST_STATUS_LABEL,
  REQUEST_TYPE,
  REQUEST_TYPE_LABEL,
} from "../../constants";
import "./InboxPage.css";

const PAGE_SIZE = 10;
const TABS = [
  { value: "received", label: "받은 요청" },
  { value: "sent", label: "보낸 요청" },
];
const unwrap = (response) => response?.data?.data ?? response?.data;

function getRequestTime(value) {
  if (!value) return "날짜 정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 정보 없음";

  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  if (hours < 48) return "어제";
  return date.toLocaleDateString("ko-KR");
}

function formatScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return "0";
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "sent" ? "sent" : "received";
  const requestedType = searchParams.get("type");
  const type = [REQUEST_TYPE.APPLY, REQUEST_TYPE.INVITE].includes(requestedType)
    ? requestedType
    : "";
  const requestedPage = Number(searchParams.get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const requestKey = `${tab}:${type}:${page}`;

  const [requestData, setRequestData] = useState({
    key: "",
    items: [],
    totalCount: 0,
  });
  const [requestError, setRequestError] = useState({ key: "", message: "" });
  const [requestRetry, setRequestRetry] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [busyRequestId, setBusyRequestId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const isLoading = requestData.key !== requestKey && requestError.key !== requestKey;
  const currentError = requestError.key === requestKey ? requestError.message : "";
  const items = requestData.key === requestKey ? requestData.items : [];
  const totalCount = requestData.key === requestKey ? requestData.totalCount : 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    let active = true;
    const params = { tab, page, size: PAGE_SIZE, status: REQUEST_STATUS.PENDING };
    if (type) params.type = type;

    getRequests(params)
      .then((response) => {
        if (!active) return;
        const result = unwrap(response);
        setRequestData({
          key: requestKey,
          items: result?.items ?? [],
          totalCount: Number(result?.totalCount ?? 0),
        });
        setRequestError({ key: "", message: "" });
      })
      .catch((error) => {
        if (active) {
          setRequestError({
            key: requestKey,
            message: getErrorMessage(error, "요청 목록을 불러오지 못했습니다."),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [page, requestKey, requestRetry, tab, type]);

  useEffect(() => {
    let active = true;
    const refreshPendingCount = () => {
      getPendingRequestCount()
        .then((response) => {
          if (active) setPendingCount(Number(unwrap(response)?.count ?? 0));
        })
        .catch(() => {});
    };
    refreshPendingCount();
    const intervalId = window.setInterval(refreshPendingCount, 60_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [page, tab, type]);

  const filters = useMemo(() => [
    { value: "", label: "전체" },
    {
      value: REQUEST_TYPE.APPLY,
      label: tab === "received" ? "참여 요청 (내 모집 글)" : "참여 요청 (내가 지원)",
    },
    {
      value: REQUEST_TYPE.INVITE,
      label: tab === "received" ? "초대 요청 (나를 초대)" : "초대 요청 (내가 초대)",
    },
  ], [tab]);

  function updateQuery(nextTab, nextType = type, nextPage = 1) {
    const next = { tab: nextTab };
    if (nextType) next.type = nextType;
    if (nextPage > 1) next.page = String(nextPage);
    setActionError("");
    setActionMessage("");
    setSearchParams(next);
  }

  async function handleAction(item, action) {
    const requestId = String(item.id);
    if (busyRequestId) return;

    const confirmationMessage = {
      reject: "이 요청을 거절하시겠습니까?",
      cancel: "보낸 요청을 취소하시겠습니까?",
    }[action];
    if (confirmationMessage && !window.confirm(confirmationMessage)) return;

    setBusyRequestId(requestId);
    setActionError("");
    setActionMessage("");
    try {
      if (action === "accept") await acceptRequest(item.id);
      else if (action === "reject") await rejectRequest(item.id);
      else await cancelRequest(item.id);

      setRequestData((current) => {
        if (current.key !== requestKey) return current;
        return {
          ...current,
          items: current.items.filter((row) => String(row.id) !== requestId),
          totalCount: Math.max(0, current.totalCount - 1),
        };
      });

      if (items.length === 1 && page > 1) {
        updateQuery(tab, type, page - 1);
      }

      if (action !== "cancel") {
        try {
          const response = await getPendingRequestCount();
          setPendingCount(Number(unwrap(response)?.count ?? 0));
        } catch {
          // 목록 상태 변경은 성공했으므로, 배지는 다음 갱신 때 다시 읽는다.
        }
      }

      setActionMessage({
        accept: "요청을 수락했습니다.",
        reject: "요청을 거절했습니다.",
        cancel: "요청을 취소했습니다.",
      }[action]);
      notifyRequestsUpdated();
    } catch (error) {
      setActionError(getErrorMessage(error, "요청을 처리하지 못했습니다. 다시 시도해 주세요."));
    } finally {
      setBusyRequestId(null);
    }
  }

  const tabsWithCounts = TABS.map((item) => ({
    ...item,
    count: item.value === "received" ? pendingCount : null,
  }));

  return (
    <main className="request-inbox">
      <div className="request-inbox__content">
        <header className="request-inbox__heading">
          <h1 className="request-inbox__title">요청함</h1>
          <p className="request-inbox__description">
            모집자 ↔ 지원자 간 참여 요청과 초대 요청을 관리하세요.
          </p>
        </header>

        <div className="request-inbox__tabs" role="tablist" aria-label="요청 방향">
          {tabsWithCounts.map((item) => (
            <button
              aria-selected={tab === item.value}
              className={`request-inbox__tab${tab === item.value ? " request-inbox__tab--active" : ""}`}
              key={item.value}
              onClick={() => updateQuery(item.value, "")}
              role="tab"
              type="button"
            >
              {item.label}
              {item.count > 0 && <span className="request-inbox__count">{item.count}</span>}
            </button>
          ))}
        </div>

        <div className="request-inbox__filters" role="group" aria-label="요청 종류 필터">
          {filters.map((filter) => (
            <button
              aria-pressed={type === filter.value}
              className={`request-inbox__filter${type === filter.value ? " request-inbox__filter--active" : ""}`}
              key={filter.value || "all"}
              onClick={() => updateQuery(tab, filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        {(actionError || actionMessage || currentError) && (
          <div
            className={`request-inbox__notice${actionError || currentError ? " request-inbox__notice--error" : ""}`}
            role={actionError || currentError ? "alert" : "status"}
          >
            {actionError || currentError || actionMessage}
            {currentError && (
              <button
                type="button"
                onClick={() => {
                  setRequestError({ key: "", message: "" });
                  setRequestRetry((retry) => retry + 1);
                }}
              >
                다시 시도
              </button>
            )}
          </div>
        )}

        <section className="request-inbox__list" aria-label={tab === "received" ? "받은 요청 목록" : "보낸 요청 목록"}>
          {isLoading ? (
            <div className="request-inbox__empty" role="status">요청 목록을 불러오는 중입니다.</div>
          ) : currentError ? null : items.length === 0 ? (
            <div className="request-inbox__empty">
              <strong>{tab === "received" ? "받은 요청이 없습니다." : "보낸 요청이 없습니다."}</strong>
              <span>다른 요청 종류를 선택해 확인해 보세요.</span>
            </div>
          ) : items.map((item) => {
            const isPending = item.status === REQUEST_STATUS.PENDING;
            const otherId = tab === "received" ? item.senderId : item.receiverId;
            const typeLabel = REQUEST_TYPE_LABEL[item.type] ?? "요청";
            const typeClass = item.type === REQUEST_TYPE.INVITE ? "invite" : "apply";

            return (
              <article className="request-inbox__item" key={item.id}>
                <span className="request-inbox__avatar" aria-hidden="true">
                  {item.otherNickname?.slice(0, 1) ?? "?"}
                </span>
                <div className="request-inbox__item-copy">
                  <div className="request-inbox__item-meta">
                    <span className={`request-inbox__type request-inbox__type--${typeClass}`}>
                      {typeLabel}
                    </span>
                    <strong className="request-inbox__nickname">{item.otherNickname ?? "사용자"}</strong>
                    {(item.otherLevel || item.otherTotalScore !== undefined) && (
                      <span className="request-inbox__level">
                        {item.otherLevel ?? "STARTER"} · {formatScore(item.otherTotalScore)}점
                      </span>
                    )}
                    <time className="request-inbox__time" dateTime={item.createdAt}>
                      {getRequestTime(item.createdAt)}
                    </time>
                  </div>
                  <Link className="request-inbox__project" to={`/projects/${item.projectId}`}>
                    <span aria-hidden="true">📌</span> {item.projectTitle ?? "모집 글"}
                  </Link>
                </div>

                <div className="request-inbox__actions">
                  {isPending && (
                    <span className="request-inbox__status request-inbox__status--pending">
                      {REQUEST_STATUS_LABEL[item.status] ?? "대기"} 중
                    </span>
                  )}
                  {tab === "received" && (
                    <>
                      <Link className="request-inbox__button request-inbox__button--outline" to={`/members/${otherId}`}>
                        프로필 보기
                      </Link>
                      {item.type === REQUEST_TYPE.INVITE && (
                        <Link className="request-inbox__button request-inbox__button--outline" to={`/projects/${item.projectId}`}>
                          모집 글 보기
                        </Link>
                      )}
                      {isPending && (
                        <>
                          <button
                            className="request-inbox__button request-inbox__button--accept"
                            disabled={busyRequestId === String(item.id)}
                            onClick={() => handleAction(item, "accept")}
                            type="button"
                          >
                            {busyRequestId === String(item.id) ? "처리 중…" : "수락"}
                          </button>
                          <button
                            className="request-inbox__button request-inbox__button--reject"
                            disabled={busyRequestId === String(item.id)}
                            onClick={() => handleAction(item, "reject")}
                            type="button"
                          >
                            거절
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {tab === "sent" && (
                    isPending ? (
                      <button
                        className="request-inbox__button request-inbox__button--cancel"
                        disabled={busyRequestId === String(item.id)}
                        onClick={() => handleAction(item, "cancel")}
                        type="button"
                      >
                        {busyRequestId === String(item.id) ? "취소 중…" : "요청 취소"}
                      </button>
                    ) : (
                      <span className={`request-inbox__status request-inbox__status--${String(item.status).toLowerCase()}`}>
                        {REQUEST_STATUS_LABEL[item.status] ?? item.status}
                      </span>
                    )
                  )}
                  {tab === "received" && !isPending && (
                    <span className={`request-inbox__status request-inbox__status--${String(item.status).toLowerCase()}`}>
                      {REQUEST_STATUS_LABEL[item.status] ?? item.status}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {totalCount > 0 && !currentError && (
          <nav className="request-inbox__pagination" aria-label="요청 페이지 이동">
            <button
              className="request-inbox__page-button"
              disabled={page <= 1 || isLoading}
              onClick={() => updateQuery(tab, type, page - 1)}
              type="button"
            >
              이전
            </button>
            <span>{page} / {pageCount}</span>
            <button
              className="request-inbox__page-button"
              disabled={page >= pageCount || isLoading}
              onClick={() => updateQuery(tab, type, page + 1)}
              type="button"
            >
              다음
            </button>
          </nav>
        )}

        <p className="request-inbox__helper">
          처리가 끝난 요청은 요청함에서 사라집니다. 수락한 요청은 해당 프로젝트 팀원으로 등록됩니다.
        </p>
      </div>
    </main>
  );
}

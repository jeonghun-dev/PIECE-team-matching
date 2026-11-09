// 공통 상단 메뉴
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getNotifications, getPendingRequestCount, REQUESTS_UPDATED_EVENT } from "../../api/requests";
import { REQUEST_STATUS_LABEL, REQUEST_TYPE_LABEL } from "../../constants";
import "./Header.css";

// Header를 숨길 화면
const HIDE_PATHS = ["/login", "/signup"];

function Header() {
    // 로그인 정보, 현재 주소, 페이지 이동 함수 가져오기
    const { user, isLoggedIn, loading, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [pendingCount, setPendingCount] = useState(0);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationItems, setNotificationItems] = useState(null);
    const [notificationError, setNotificationError] = useState("");
    const [notificationVersion, setNotificationVersion] = useState(0);
    const notificationRef = useRef(null);

    const refreshPendingCount = useCallback(async () => {
        try {
            const response = await getPendingRequestCount();
            setPendingCount(Number(response.data?.data?.count ?? 0));
        } catch {
            // 서버를 사용할 수 없어도 공통 헤더 탐색은 계속 가능하게 둔다.
        }
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return undefined;

        refreshPendingCount();
        const intervalId = window.setInterval(refreshPendingCount, 60_000);
        return () => window.clearInterval(intervalId);
    }, [isLoggedIn, location.pathname, location.search, refreshPendingCount]);

    useEffect(() => {
        const handleRequestsUpdated = () => {
            refreshPendingCount();
            setNotificationItems(null);
            setNotificationError("");
            setNotificationVersion((version) => version + 1);
        };
        window.addEventListener(REQUESTS_UPDATED_EVENT, handleRequestsUpdated);
        return () => window.removeEventListener(REQUESTS_UPDATED_EVENT, handleRequestsUpdated);
    }, [refreshPendingCount]);

    useEffect(() => {
        if (!notificationOpen || !isLoggedIn) return undefined;
        let active = true;
        const refreshNotifications = () => {
            getNotifications()
                .then((response) => {
                    if (active) {
                        setNotificationItems(response.data?.data ?? []);
                        setNotificationError("");
                    }
                })
                .catch((error) => {
                    if (active) {
                        setNotificationError(
                            error.response?.data?.message ?? "알림을 불러오지 못했습니다.",
                        );
                        setNotificationItems([]);
                    }
                });
        };
        refreshNotifications();
        const intervalId = window.setInterval(refreshNotifications, 60_000);
        return () => {
            active = false;
            window.clearInterval(intervalId);
        };
    }, [notificationOpen, notificationVersion, isLoggedIn]);

    useEffect(() => {
        if (!notificationOpen) return undefined;
        const closeOnOutsideClick = (event) => {
            if (!notificationRef.current?.contains(event.target)) {
                setNotificationOpen(false);
            }
        };
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setNotificationOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [notificationOpen]);

    // 로그인·회원가입 화면에서는 표시하지 않음
    if (HIDE_PATHS.includes(location.pathname)) {
        return null;
    }

    // 현재 주소가 메뉴 주소로 시작하면 강조
    const menuClass = (path) => {
        return location.pathname.startsWith(path) ? "header__menu header__menu--active" : "header__menu";
    };

    // 로그아웃: 토큰 삭제 후 메인으로 이동
    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <header className="header">
            <div className="header__inner">

                {/* 로고 → 메인 */}
                <Link to="/" className="header__logo">
                    <img
                        src="/piece-logo.png"
                        alt="PIECE"
                        className="header__logo-img"
                    />
                </Link>

                {/* 공통 메뉴 */}
                <nav className="header__nav" aria-label="주요 메뉴">
                    <Link to="/projects" className={menuClass("/projects")}>모집 게시판</Link>
                    <Link to="/questions" className={menuClass("/questions")}>질문 게시판</Link>
                    <Link to="/members" className={menuClass("/members")}>팀원 찾기</Link>
                    <Link to="/requests" className={menuClass("/requests")}>
                        요청함
                        {isLoggedIn && pendingCount > 0 && (
                            <span className="header__request-count">{pendingCount}</span>
                        )}
                    </Link>
                </nav>

                <div className="header__right">

                    {/* 로그인 상태 */}
                    {!loading && isLoggedIn && (
                        <>
                            <Link to="/projects/new" className="header__button header__button--primary">
                                모집 글 작성
                            </Link>

                            <div className="header__notification" ref={notificationRef}>
                                <button
                                    aria-expanded={notificationOpen}
                                    aria-haspopup="dialog"
                                    aria-label="알림"
                                    className="header__button header__notification-button"
                                    onClick={() => {
                                        if (!notificationOpen) {
                                            setNotificationItems(null);
                                            setNotificationError("");
                                        }
                                        setNotificationOpen((open) => !open);
                                    }}
                                    type="button"
                                >
                                    <svg aria-hidden="true" className="header__bell-icon" viewBox="0 0 24 24">
                                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                                    </svg>
                                    {pendingCount > 0 && <span className="header__notification-dot" />}
                                </button>
                                {notificationOpen && (
                                    <section
                                        aria-label="최근 알림"
                                        className="header__notification-panel"
                                        role="dialog"
                                    >
                                        <div className="header__notification-heading">
                                            <strong>알림</strong>
                                            <span>{notificationItems?.length ?? 0}개</span>
                                        </div>
                                        {notificationError && (
                                            <p className="header__notification-message" role="alert">{notificationError}</p>
                                        )}
                                        {notificationError ? null : notificationItems === null ? (
                                            <p className="header__notification-message" role="status">알림을 불러오는 중입니다.</p>
                                        ) : notificationItems.length === 0 ? (
                                            <p className="header__notification-message">새로운 요청 알림이 없습니다.</p>
                                        ) : (
                                            <ul className="header__notification-list">
                                                {notificationItems.map((item) => (
                                                    <li key={item.id}>
                                                        <Link
                                                            className="header__notification-item"
                                                            onClick={() => setNotificationOpen(false)}
                                                            to="/requests?tab=received"
                                                        >
                                                            <span className="header__notification-item-title">
                                                                {item.otherNickname ?? "사용자"}님이 {REQUEST_TYPE_LABEL[item.type] ?? "요청"}을 보냈어요
                                                            </span>
                                                            <span className="header__notification-item-project">{item.projectTitle ?? "모집 글"}</span>
                                                            <span className="header__notification-item-status">
                                                                {REQUEST_STATUS_LABEL[item.status] ?? item.status}
                                                            </span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <Link
                                            className="header__notification-all"
                                            onClick={() => setNotificationOpen(false)}
                                            to="/requests?tab=received"
                                        >
                                            요청함에서 전체 보기
                                        </Link>
                                    </section>
                                )}
                            </div>

                            <Link to="/mypage" className="header__user">
                                {user.nickname}
                            </Link>

                            <button type="button" className="header__button" onClick={handleLogout}>
                                로그아웃
                            </button>
                        </>
                    )}

                    {/* 비로그인 상태 */}
                    {!loading && !isLoggedIn && (
                        <>
                            <Link to="/login" className="header__button">
                                로그인
                            </Link>
                            <Link to="/signup" className="header__button header__button--primary">
                                회원가입
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export { Header };

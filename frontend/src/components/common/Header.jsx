// 공통 상단 메뉴
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Header.css";

// Header를 숨길 화면
const HIDE_PATHS = ["/login", "/signup"];

function Header() {
    // 로그인 정보, 현재 주소, 페이지 이동 함수 가져오기
    const { user, isLoggedIn, loading, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

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
                        src="/PIECE_rogo.png"
                        alt="PIECE"
                        className="header__logo-img"
                    />
                </Link>

                {/* 공통 메뉴 */}
                <nav className="header__nav" aria-label="주요 메뉴">
                    <Link to="/projects" className={menuClass("/projects")}>모집 게시판</Link>
                    <Link to="/questions" className={menuClass("/questions")}>질문 게시판</Link>
                    <Link to="/members" className={menuClass("/members")}>팀원 찾기</Link>
                    <Link to="/requests" className={menuClass("/requests")}>요청함</Link>
                </nav>

                <div className="header__right">

                    {/* 로그인 상태 */}
                    {!loading && isLoggedIn && (
                        <>
                            <Link to="/projects/new" className="header__button header__button--primary">
                                모집 글 작성
                            </Link>

                            {/* TODO 4.37: 받은 요청 개수 배지, 알림 목록 */}
                            <button type="button" className="header__button">
                                알림
                            </button>

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
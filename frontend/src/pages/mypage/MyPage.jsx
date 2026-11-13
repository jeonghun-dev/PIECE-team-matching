// SCR-17~19 마이페이지 (박도영·김성진)
// SCR-17~19 마이페이지 레이아웃 (김성진) - REQ-USR-004
// 왼쪽: 내 정보 + 메뉴 / 오른쪽: 주소에 따라 기술 프로필(박도영) 또는 활동(참여 중인 팀·내 모집 글·최근 질문/답변)
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ProfileTab from "./ProfileTab";
import ActivityTab from "./ActivityTab";
import "./MyPage.css";

// 메뉴 목록
const MENUS = [
    { path: "/mypage/profile", label: "기술 프로필" },
    { path: "/mypage/teams", label: "참여 중인 팀" },
    { path: "/mypage/projects", label: "내 모집 글 관리" },
];

// 점수 표시: 정수면 6점, 소수면 6.5점 (스타일 가이드 9)
const formatScore = (score) => {
    const value = Number(score);
    if (Number.isInteger(value)) {
        return `${value}점`;
    }
    return `${value.toFixed(1)}점`;
};

function MyPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // 1. 지금 보고 있는 메뉴
    const isProfile = location.pathname === "/mypage/profile";

    // 2. 로그아웃 후 메인으로
    const handleLogout = async () => {
        navigate("/");
        
        await logout();
    };

    // ProtectedRoute를 지나왔지만, 내 정보가 아직 없으면 잠깐 비워 둠
    if (!user) {
        return null;
    }

    return (
        <main className="mypage">
            <div className="mypage__layout">
                {/* 왼쪽: 내 정보 + 메뉴 */}
                <aside className="mypage-side">
                    <div className="mypage-side__avatar" aria-hidden="true">
                        {user.nickname.slice(0, 1)}
                    </div>
                    <p className="mypage-side__name">{user.nickname}</p>
                    <p className="mypage-side__email">{user.email}</p>
                    <span className={`mypage-side__level mypage-side__level--${String(user.level).toLowerCase()}`}>
                        {user.level} · {formatScore(user.totalScore)}
                    </span>
                    {user.profile && user.profile.intro && (
                        <p className="mypage-side__intro">{user.profile.intro}</p>
                    )}

                    <nav className="mypage-side__menu" aria-label="마이페이지 메뉴">
                        {MENUS.map((menu) => (
                            <Link
                                key={menu.path}
                                to={menu.path}
                                className={location.pathname === menu.path ? "mypage-side__link mypage-side__link--active" : "mypage-side__link"}
                                aria-current={location.pathname === menu.path ? "page" : undefined}
                            >
                                {menu.label}
                            </Link>
                        ))}
                    </nav>

                    <button type="button" className="mypage-side__logout" onClick={handleLogout}>
                        로그아웃
                    </button>
                </aside>

                {/* 오른쪽: 메뉴별 내용 */}
                <div className="mypage__content">
                    {isProfile && <ProfileTab />}
                    {!isProfile && <ActivityTab />}
                </div>
            </div>
        </main>
    );
}

export default MyPage;
// 공통 에러 화면 
import { Link, useNavigate } from "react-router-dom";
import "./ErrorPage.css";

function ErrorPage() {
    const navigate = useNavigate();

    // 이전 화면으로 돌아가기
    const handleBack = () => {
        navigate(-1);
    };

    return (
        <main className="error-page">
            <section className="error-card" aria-labelledby="error-title">
                {/* 404 숫자와 안내 문구 */}
                <p className="error-card__code">404</p>
                <h1 id="error-title" className="error-card__title">페이지를 찾을 수 없어요</h1>
                <p className="error-card__description">
                    주소가 잘못되었거나 삭제된 페이지예요.
                    <br />
                    입력한 주소를 다시 확인해 주세요.
                </p>

                {/* 이동 버튼 */}
                <div className="error-card__actions">
                    <button type="button" className="error-card__button" onClick={handleBack}>
                        이전 페이지
                    </button>
                    <Link to="/" className="error-card__button error-card__button--primary">
                        메인으로 가기
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default ErrorPage;
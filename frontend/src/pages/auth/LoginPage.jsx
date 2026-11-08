// SCR-04 로그인 (박도영)
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginApi } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import './LoginPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    const trimmedEmail = email.trim();

    // 1. 빈 값 검사
    if (!trimmedEmail) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }

    // 2. 길이 및 형식 검사
    if (trimmedEmail.length > 100 || !EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('올바른 이메일 형식을 입력해주세요. (최대 100자)');
      return;
    }
    if (password.length < 8) {
      setPasswordError('비밀번호는 8자 이상 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await loginApi({
        email: trimmedEmail,
        password,
      });

      const { token, user } = resp.data.data;
      login(token, user);

      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message || '이메일 또는 비밀번호가 일치하지 않습니다.';
      setPasswordError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        {/* 상단 로고 및 인사말 */}
        <header className="login-card__header">
          <div className="login-card__brand">
            <span className="login-card__logo" aria-hidden="true">
              <span className="login-card__logo-dot" />
            </span>
            <h1 id="login-title" className="login-card__title">
              PIECE
            </h1>
          </div>
          <p className="login-card__subtitle">다시 오신 걸 환영해요</p>
        </header>

        {/* 로그인 입력 폼 */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-form__field">
            <label htmlFor="email" className="login-form__label">
              이메일
            </label>
            <input
              id="email"
              type="email"
              className={`login-form__input ${
                emailError ? 'login-form__input--error' : ''
              }`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="example@devmates.kr"
              autoComplete="email"
            />
            {emailError && (
              <p className="login-form__error" role="alert">
                {emailError}
              </p>
            )}
          </div>

          <div className="login-form__field">
            <label htmlFor="password" className="login-form__label">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              className={`login-form__input ${
                passwordError ? 'login-form__input--error' : ''
              }`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              placeholder="비밀번호 입력"
              autoComplete="current-password"
            />
            {passwordError && (
              <p className="login-form__error" role="alert">
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="login-form__submit"
            disabled={submitting}
          >
            {submitting ? '처리 중…' : '로그인'}
          </button>
        </form>

        {/* 하단 회원가입 안내 */}
        <p className="login-card__footer">
          아직 회원이 아니신가요?{' '}
          <Link to="/signup" className="login-card__link">
            회원가입
          </Link>
        </p>
      </section>

      <footer className="login-page__copyright">PIECE · 6팀 DevMates</footer>
    </main>
  );
}

export default LoginPage;
// SCR-04 로그인 (박도영)
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginApi } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();

    // 1. 빈 값 검사
    if (!trimmedEmail) {
      setErrorMessage('이메일을 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }

    // 2. 길이 및 형식 검사
    if (trimmedEmail.length > 100 || !EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage('올바른 이메일 형식을 입력해주세요. (최대 100자)');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상 입력해주세요.');
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
        error.response?.data?.message || '로그인 중 오류가 발생했습니다.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>PIECE</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email">이메일</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label htmlFor="password">비밀번호</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
          />
        </div>

        {errorMessage && <p role="alert">{errorMessage}</p>}

        <div>
          <button type="submit" disabled={submitting}>
            {submitting ? '처리 중…' : '로그인'}
          </button>
        </div>
      </form>

      <p>
        계정이 없으신가요? <Link to="/signup">회원가입</Link>
      </p>
    </div>
  );
}

export default LoginPage;
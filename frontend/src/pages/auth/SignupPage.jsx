// SCR-05 회원가입 (박도영)
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupApi } from '../../api/auth';
import {
  ACTIVE_TIME,
  ACTIVE_TIME_OPTIONS,
  CERTIFICATE,
  CERTIFICATE_OPTIONS as BASE_CERTIFICATE_OPTIONS,
  COLLABORATION_MODE,
  COLLABORATION_OPTIONS,
} from '../../constants';
import './SignupPage.css';

const CERTIFICATE_POINT_TEXT = {
  [CERTIFICATE.ENGINEER]: '+2점',
  [CERTIFICATE.INDUSTRIAL]: '+1점',
  [CERTIFICATE.SQLD]: '+1점',
  [CERTIFICATE.LINUX]: '+1점',
  [CERTIFICATE.PROGRAMMING]: '+0.5점',
  [CERTIFICATE.ADSP]: '+0.5점',
};

const CERTIFICATE_OPTIONS = BASE_CERTIFICATE_OPTIONS.map((item) => ({
  ...item,
  pointText: CERTIFICATE_POINT_TEXT[item.code] || '',
}));

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_-]{2,30}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const URL_REGEX = /^(https?:\/\/)?(www\.)?github\.com\/.+/;

function SignupPage() {
  const navigate = useNavigate();

  // 1. 계정 정보
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // 2. 학습 이력 입력
  const [certificates, setCertificates] = useState([]);
  const [awardCount, setAwardCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);

  // 3. 프로필 설정
  const [collaborationMode, setCollaborationMode] = useState(COLLABORATION_MODE.ONLINE);
  const [activeTimes, setActiveTimes] = useState([ACTIVE_TIME.WEEKDAY_NIGHT]);
  const [lookingForTeam, setLookingForTeam] = useState(true);
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // 4. 약관 동의
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // 오류 및 제출 상태
  const [nicknameError, setNicknameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [urlError, setUrlError] = useState('');

  const allAgreed = termsAgreed && privacyAgreed;

  // 자격증 체크 토글
  const handleToggleCertificate = (code) => {
    setCertificates((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // 주요 활동 시간 토글
  const handleToggleActiveTime = (code) => {
    setActiveTimes((prev) =>
      prev.includes(code) ? prev.filter((t) => t !== code) : [...prev, code]
    );
  };

  // 전체 동의 토글
  const handleToggleAllAgreed = (checked) => {
    setTermsAgreed(checked);
    setPrivacyAgreed(checked);
  };

  // 점수 표시 계산
  const awardScore = awardCount * 3;
  const projectScore = projectCount * 1.5;

  const isPasswordMatch =
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    password === passwordConfirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNicknameError('');
    setEmailError('');
    setErrorMessage('');
    setUrlError('');

    const trimmedNickname = nickname.trim();
    const trimmedEmail = email.trim();
    const trimmedPortfolioUrl = portfolioUrl.trim();

    // 프론트 입력 검증
    if (!trimmedNickname || !NICKNAME_REGEX.test(trimmedNickname)) {
      setNicknameError(
        '닉네임은 2~30자의 한글, 영문, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있습니다.'
      );
      return;
    }

    if (!trimmedEmail || trimmedEmail.length > 100 || !EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('유효한 이메일 주소를 입력해주세요. (최대 100자)');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setErrorMessage(
        '비밀번호는 영문, 숫자, 특수문자를 모두 포함하여 8자 이상이어야 합니다.'
      );
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (!collaborationMode) {
      setErrorMessage('협업 방식을 선택해주세요.');
      return;
    }

    if (activeTimes.length === 0) {
      setErrorMessage('주요 활동 시간을 최소 1개 이상 선택해야 합니다.');
      return;
    }

    // 변경 후 (500자 길이 제한 추가) 포트폴리오 URL 검증
    if (trimmedPortfolioUrl) {
      if (trimmedPortfolioUrl.length > 500) {
        setUrlError('포트폴리오 URL은 500자 이하로 입력해 주세요.');
        return;
      }
      if (!URL_REGEX.test(trimmedPortfolioUrl)) {
        setUrlError('깃허브 링크 주소만 입력할 수 있습니다.');
        return;
      }
    }

    if (!termsAgreed || !privacyAgreed) {
      setErrorMessage(
        '서비스 이용약관 및 개인정보 수집·이용에 모두 동의해야 가입할 수 있습니다.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const resp = await signupApi({
        nickname: trimmedNickname,
        email: trimmedEmail,
        password,
        passwordConfirm,
        certificates,
        awardCount,
        projectCount,
        collaborationMode,
        activeTimes,
        lookingForTeam,
        portfolioUrl: trimmedPortfolioUrl || null,
        termsAgreed,
        privacyAgreed,
      });

      navigate('/signup/complete', { state: resp.data.data });
    } catch (error) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message || '회원가입 중 오류가 발생했습니다.';

      // 409 중복 에러일 때 해당 입력칸 아래에도 표시
      if (status === 409) {
        if (message.includes('이메일')) {
          setEmailError(message);
        }
        if (message.includes('닉네임')) {
          setNicknameError(message);
        }
      }
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="signup-page">
      <div className="signup-card">
        {/* 상단 제목 영역 */}
        <header className="signup-card__header">
          <Link to="/" className="signup-card__brand">
            <img
              src="/piece-logo.png"
              alt="PIECE"
              className="signup-card__logo-img"
            />
          </Link>
          <h1 className="signup-card__title">회원가입</h1>
          <p className="signup-card__subtitle">
            PIECE에서 함께할 팀원을 찾아보세요
          </p>
        </header>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          {/* 1. 계정 정보 */}
          <section className="signup-section">
            <h2 className="signup-section__title">1. 계정 정보</h2>

            <div className="signup-field">
              <label htmlFor="nickname" className="signup-label">
                닉네임 <span className="signup-required">*</span>
              </label>
              <input
                id="nickname"
                type="text"
                className={`signup-input ${nicknameError ? 'signup-input--error' : ''
                  }`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 입력"
              />
              {nicknameError ? (
                <p className="signup-error" role="alert">
                  {nicknameError}
                </p>
              ) : (
                <p className="signup-helper">
                  가입하기를 누르면 중복 여부를 확인해요.
                </p>
              )}
            </div>

            <div className="signup-field">
              <label htmlFor="email" className="signup-label">
                이메일 <span className="signup-required">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`signup-input ${emailError ? 'signup-input--error' : ''
                  }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@devmates.kr"
              />
              {emailError && (
                <p className="signup-error" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div className="signup-row">
              <div className="signup-field">
                <label htmlFor="password" className="signup-label">
                  비밀번호 <span className="signup-required">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  className="signup-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                />
                <p className="signup-helper">
                  영문 · 숫자 · 특수문자 포함 8자 이상
                </p>
              </div>

              <div className="signup-field">
                <label htmlFor="passwordConfirm" className="signup-label">
                  비밀번호 확인 <span className="signup-required">*</span>
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  className={`signup-input ${passwordConfirm.length > 0 && !isPasswordMatch
                      ? 'signup-input--error'
                      : ''
                    }`}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 확인 입력"
                />
                {passwordConfirm.length > 0 && (
                  <p
                    className={
                      isPasswordMatch ? 'signup-success' : 'signup-error'
                    }
                  >
                    {isPasswordMatch
                      ? '비밀번호가 일치합니다.'
                      : '비밀번호가 일치하지 않습니다.'}
                  </p>
                )}
              </div>
            </div>
          </section>

          <hr className="signup-divider" />

          {/* 2. 학습 이력 입력 */}
          <section className="signup-section">
            <div className="signup-section__header">
              <h2 className="signup-section__title">2. 학습 이력 입력</h2>
              <p className="signup-section__desc">
                입력한 이력으로 최초 학습 점수와 레벨이 산정되며, 가입 완료 후 확인할 수 있어요
              </p>
            </div>

            <div className="signup-field">
              <span className="signup-label">보유 자격증</span>
              <div className="signup-cert-grid">
                {CERTIFICATE_OPTIONS.map((cert) => {
                  const checked = certificates.includes(cert.code);
                  return (
                    <label
                      key={cert.code}
                      className={`signup-cert-item ${checked ? 'signup-cert-item--checked' : ''
                        }`}
                    >
                      <span className="signup-cert-item__left">
                        <input
                          type="checkbox"
                          className="signup-cert-item__checkbox"
                          checked={checked}
                          onChange={() => handleToggleCertificate(cert.code)}
                        />
                        <span className="signup-cert-item__label">
                          {cert.label}
                        </span>
                      </span>
                      <span className="signup-cert-item__point">
                        {cert.pointText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="signup-row">
              <div className="signup-field">
                <span className="signup-label">
                  공식 SW 프로그래밍 대회 수상
                </span>
                <div className="signup-counter">
                  <button
                    type="button"
                    className="signup-counter__btn"
                    onClick={() =>
                      setAwardCount((prev) => Math.max(0, prev - 1))
                    }
                  >
                    −
                  </button>
                  <span className="signup-counter__value">{awardCount}회</span>
                  <button
                    type="button"
                    className="signup-counter__btn"
                    onClick={() => setAwardCount((prev) => prev + 1)}
                  >
                    +
                  </button>
                  <span className="signup-counter__badge">+{awardScore}점</span>
                </div>
                <p className="signup-helper">1회당 3점 (중복 가능)</p>
              </div>

              <div className="signup-field">
                <span className="signup-label">
                  해커톤 · 공모전 · 프로젝트 완료
                </span>
                <div className="signup-counter">
                  <button
                    type="button"
                    className="signup-counter__btn"
                    onClick={() =>
                      setProjectCount((prev) => Math.max(0, prev - 1))
                    }
                  >
                    −
                  </button>
                  <span className="signup-counter__value">
                    {projectCount}개
                  </span>
                  <button
                    type="button"
                    className="signup-counter__btn"
                    onClick={() =>
                      setProjectCount((prev) => Math.min(3, prev + 1))
                    }
                  >
                    +
                  </button>
                  <span className="signup-counter__badge">
                    +{projectScore}점
                  </span>
                </div>
                <p className="signup-helper">1개당 1.5점 (최대 3개, 4.5점)</p>
              </div>
            </div>
          </section>

          <hr className="signup-divider" />

          {/* 3. 프로필 설정 */}
          <section className="signup-section">
            <h2 className="signup-section__title">3. 프로필 설정</h2>

            <div className="signup-row">
              <div className="signup-field">
                <span className="signup-label">
                  협업 방식 <span className="signup-required">*</span>
                </span>
                <div className="signup-chip-group">
                  {COLLABORATION_OPTIONS.map((option) => {
                    const selected = collaborationMode === option.code;
                    return (
                      <button
                        key={option.code}
                        type="button"
                        className={`signup-chip ${selected ? 'signup-chip--active' : ''
                          }`}
                        onClick={() => setCollaborationMode(option.code)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="signup-field">
                <span className="signup-label">
                  주요 활동 시간 <span className="signup-required">*</span>
                </span>
                <div className="signup-chip-group">
                  {ACTIVE_TIME_OPTIONS.map((option) => {
                    const selected = activeTimes.includes(option.code);
                    return (
                      <button
                        key={option.code}
                        type="button"
                        className={`signup-chip ${selected ? 'signup-chip--active' : ''
                          }`}
                        onClick={() => handleToggleActiveTime(option.code)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="signup-toggle-box">
              <div>
                <strong className="signup-toggle-box__title">
                  팀 구인 여부
                </strong>
                <p className="signup-toggle-box__desc">
                  켜두면 팀원 찾기에 내 프로필이 노출되고 초대를 받을 수 있어요
                </p>
              </div>
              <label className="signup-switch" aria-label="팀 구인 여부">
                <input
                  type="checkbox"
                  checked={lookingForTeam}
                  onChange={(e) => setLookingForTeam(e.target.checked)}
                />
                <span className="signup-switch__slider" />
              </label>
            </div>

            <div className="signup-field">
              <label htmlFor="portfolioUrl" className="signup-label">
                포트폴리오 URL
              </label>
              <input
                id="portfolioUrl"
                type="url"
                className={`signup-input ${urlError ? 'signup-input--error' : ''
                  }`}
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://github.com/username 주소"
              />
              {urlError && (
                <p className="signup-error" role="alert">
                  {urlError}
                </p>
              )}
            </div>
          </section>

          <hr className="signup-divider" />

          {/* 4. 약관 동의 영역 */}
          <section className="signup-terms">
            <label className="signup-terms__all">
              <input
                type="checkbox"
                className="signup-terms__checkbox"
                checked={allAgreed}
                onChange={(e) => handleToggleAllAgreed(e.target.checked)}
              />
              <span>전체 동의</span>
            </label>

            <hr className="signup-divider" />

            <div className="signup-terms__row">
              <label className="signup-terms__label">
                <input
                  type="checkbox"
                  className="signup-terms__checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                />
                <span>[필수] 서비스 이용약관 동의</span>
              </label>
              <span className="signup-terms__more">보기</span>
            </div>

            <div className="signup-terms__row">
              <label className="signup-terms__label">
                <input
                  type="checkbox"
                  className="signup-terms__checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                />
                <span>[필수] 개인정보 수집 · 이용 동의</span>
              </label>
              <span className="signup-terms__more">보기</span>
            </div>
          </section>

          {errorMessage && (
            <p className="signup-error" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="signup-submit"
            disabled={submitting}
          >
            {submitting ? '처리 중…' : '가입하기'}
          </button>
        </form>

        <p className="signup-card__footer">
          이미 회원이신가요?{' '}
          <Link to="/login" className="signup-card__link">
            로그인
          </Link>
        </p>
      </div>

      <footer className="signup-page__copyright">PIECE · 6팀 DevMates</footer>
    </main>
  );
}

export default SignupPage;
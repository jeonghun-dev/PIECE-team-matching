// SCR-05 회원가입 (박도영)
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupApi } from '../../api/auth';

const CERTIFICATE_OPTIONS = [
  { code: 'ENGINEER', label: '정보처리기사', pointText: '+2점' },
  { code: 'INDUSTRIAL', label: '정보처리산업기사', pointText: '+1점' },
  { code: 'SQLD', label: 'SQLD', pointText: '+1점' },
  { code: 'LINUX', label: '리눅스마스터', pointText: '+1점' },
  { code: 'PROGRAMMING', label: '프로그래밍기능사', pointText: '+0.5점' },
  { code: 'ADSP', label: 'ADsP', pointText: '+0.5점' },
];

const COLLABORATION_OPTIONS = [
  { code: 'ONLINE', label: '온라인' },
  { code: 'OFFLINE', label: '오프라인' },
  { code: 'ANY', label: '무관' },
];

const ACTIVE_TIME_OPTIONS = [
  { code: 'WEEKDAY_DAY', label: '평일 낮' },
  { code: 'WEEKDAY_NIGHT', label: '평일 저녁' },
  { code: 'WEEKEND_AM', label: '주말 낮' },
  { code: 'WEEKEND_PM', label: '주말 저녁' },
];

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
  const [collaborationMode, setCollaborationMode] = useState('ONLINE');
  const [activeTimes, setActiveTimes] = useState(['WEEKDAY_NIGHT']);
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
      const resp = await client.post('/auth/signup', {
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
    <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'left', padding: '24px' }}>
      {/* 상단 제목 영역 */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p>
          <strong>PIECE</strong>
        </p>
        <h1>회원가입</h1>
        <p>PIECE에서 함께할 팀원을 찾아보세요</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* 1. 계정 정보 */}
        <section>
          <h2>1. 계정 정보</h2>

          <div>
            <label htmlFor="nickname">닉네임 *</label>
            <br />
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 입력"
              style={{ width: '100%' }}
            />
            {nicknameError ? (
              <p role="alert">{nicknameError}</p>
            ) : (
              <p>가입하기를 누르면 중복 여부를 확인해요.</p>
            )}
          </div>

          <br />

          <div>
            <label htmlFor="email">이메일 *</label>
            <br />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@devmates.kr"
              style={{ width: '100%' }}
            />
            {emailError && <p role="alert">{emailError}</p>}
          </div>

          <br />

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="password">비밀번호 *</label>
              <br />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                style={{ width: '100%' }}
              />
              <p>영문 · 숫자 · 특수문자 포함 8자 이상</p>
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="passwordConfirm">비밀번호 확인 *</label>
              <br />
              <input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 확인 입력"
                style={{ width: '100%' }}
              />
              {passwordConfirm.length > 0 && (
                <p>
                  {isPasswordMatch
                    ? '비밀번호가 일치합니다.'
                    : '비밀번호가 일치하지 않습니다.'}
                </p>
              )}
            </div>
          </div>
        </section>

        <hr />

        {/* 2. 학습 이력 입력 */}
        <section>
          <h2>2. 학습 이력 입력</h2>
          <p>
            입력한 이력으로 최초 학습 점수와 레벨이 산정되며, 가입 완료 후 확인할 수 있어요
          </p>

          <br />

          <div>
            <label>보유 자격증</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              {CERTIFICATE_OPTIONS.map((cert) => (
                <label
                  key={cert.code}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    border: '1px solid #ccc',
                    padding: '8px',
                  }}
                >
                  <span>
                    <input
                      type="checkbox"
                      checked={certificates.includes(cert.code)}
                      onChange={() => handleToggleCertificate(cert.code)}
                    />{' '}
                    {cert.label}
                  </span>
                  <span>{cert.pointText}</span>
                </label>
              ))}
            </div>
          </div>

          <br />

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label>공식 SW 프로그래밍 대회 수상</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setAwardCount((prev) => Math.max(0, prev - 1))}
                >
                  -
                </button>
                <span>{awardCount}회</span>
                <button
                  type="button"
                  onClick={() => setAwardCount((prev) => prev + 1)}
                >
                  +
                </button>
                <span>+{awardScore}점</span>
              </div>
              <p>1회당 3점 (중복 가능)</p>
            </div>

            <div style={{ flex: 1 }}>
              <label>해커톤 · 공모전 · 프로젝트 완료</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setProjectCount((prev) => Math.max(0, prev - 1))}
                >
                  -
                </button>
                <span>{projectCount}개</span>
                <button
                  type="button"
                  onClick={() => setProjectCount((prev) => Math.min(3, prev + 1))}
                >
                  +
                </button>
                <span>+{projectScore}점</span>
              </div>
              <p>1개당 1.5점 (최대 3개, 4.5점)</p>
            </div>
          </div>
        </section>

        <hr />

        {/* 3. 프로필 설정 */}
        <section>
          <h2>3. 프로필 설정</h2>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label>협업 방식 *</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {COLLABORATION_OPTIONS.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setCollaborationMode(option.code)}
                    style={{
                      fontWeight: collaborationMode === option.code ? 'bold' : 'normal',
                      border:
                        collaborationMode === option.code
                          ? '2px solid #000'
                          : '1px solid #ccc',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label>주요 활동 시간 *</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {ACTIVE_TIME_OPTIONS.map((option) => {
                  const selected = activeTimes.includes(option.code);
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => handleToggleActiveTime(option.code)}
                      style={{
                        fontWeight: selected ? 'bold' : 'normal',
                        border: selected ? '2px solid #000' : '1px solid #ccc',
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <br />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #ccc',
              padding: '12px',
            }}
          >
            <div>
              <strong>팀 구인 여부</strong>
              <p>켜두면 팀원 찾기에 내 프로필이 노출되고 초대를 받을 수 있어요</p>
            </div>
            <input
              type="checkbox"
              aria-label="팀 구인 여부"
              checked={lookingForTeam}
              onChange={(e) => setLookingForTeam(e.target.checked)}
            />
          </div>

          <br />

          <div>
            <label htmlFor="portfolioUrl">포트폴리오 URL</label>
            <br />
            <input
              id="portfolioUrl"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/username 또는 포트폴리오 주소"
              style={{ width: '100%', marginTop: '8px' }}
            />
            {urlError && <p style={{ color: 'red', marginTop: '4px' }}>{urlError}</p>}
          </div>
        </section>

        <hr />

        {/* 약관 동의 영역 */}
        <section style={{ border: '1px solid #ccc', padding: '12px' }}>
          <div>
            <label>
              <input
                type="checkbox"
                checked={allAgreed}
                onChange={(e) => handleToggleAllAgreed(e.target.checked)}
              />{' '}
              <strong>전체 동의</strong>
            </label>
          </div>

          <hr />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label>
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
              />{' '}
              [필수] 서비스 이용약관 동의
            </label>
            <span>보기</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
              />{' '}
              [필수] 개인정보 수집 · 이용 동의
            </label>
            <span>보기</span>
          </div>
        </section>

        <br />

        {errorMessage && <p role="alert">{errorMessage}</p>}

        <div>
          <button
            type="submit"
            disabled={submitting}
            style={{ width: '100%', padding: '12px' }}
          >
            {submitting ? '처리 중…' : '가입하기'}
          </button>
        </div>
      </form>

      <p style={{ textAlign: 'center', marginTop: '16px' }}>
        이미 회원이신가요? <Link to="/login">로그인</Link>
      </p>
    </div>
  );
}

export default SignupPage;
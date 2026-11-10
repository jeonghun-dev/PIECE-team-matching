/* 주의!!! MyPage.jsx에서 다음과 같이 ProfileTab 렌더링 연결해야 표시됨 (예시)

// frontend/src/pages/mypage/MyPage.jsx
import ProfileTab from './ProfileTab';
export default function MyPage() {
  return (
    <main style={{ padding: '40px 24px', backgroundColor: 'var(--color-page, #F5F6FA)', minHeight: '100svh' }}>
      <ProfileTab />
    </main>
  );
}

*/
// SCR-17 마이페이지 - 기술 프로필 및 학습 이력 탭 (박도영)
import { useEffect, useState, useCallback } from 'react';
import { getMeApi, updateProfileApi } from '../../api/auth';
import {
  ACTIVE_TIME,
  ACTIVE_TIME_OPTIONS,
  CERTIFICATE,
  CERTIFICATE_OPTIONS as BASE_CERTIFICATE_OPTIONS,
  COLLABORATION_MODE,
  COLLABORATION_OPTIONS,
  LEVEL,
} from '../../constants';
import './ProfileTab.css';

const CERTIFICATE_META = {
  [CERTIFICATE.ENGINEER]: { score: 2.0, pointText: '+2점' },
  [CERTIFICATE.INDUSTRIAL]: { score: 1.0, pointText: '+1점' },
  [CERTIFICATE.SQLD]: { score: 1.0, pointText: '+1점' },
  [CERTIFICATE.LINUX]: { score: 1.0, pointText: '+1점' },
  [CERTIFICATE.PROGRAMMING]: { score: 0.5, pointText: '+0.5점' },
  [CERTIFICATE.ADSP]: { score: 0.5, pointText: '+0.5점' },
};

const CERTIFICATE_OPTIONS = BASE_CERTIFICATE_OPTIONS.map((item) => ({
  ...item,
  score: CERTIFICATE_META[item.code]?.score ?? 0,
  pointText: CERTIFICATE_META[item.code]?.pointText ?? '',
}));

const URL_REGEX = /^(https?:\/\/)?(www\.)?github\.com\/.+/;
const MAX_INTRO_LENGTH = 200;
const MAX_PROJECT_COUNT = 3;
const MAX_BAR_SCORE = 10;

// 점수 포맷 함수 (정수면 6, 소수면 6.5)
function formatScore(score) {
  const num = Number(score) || 0;
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

// 프론트 실시간 점수 및 레벨 계산 함수 (LevelPolicy 동일 기준)
function calculatePreviewLearning(certificates, awardCount, projectCount) {
  const uniqueCerts = [...new Set(certificates)];
  const certificateScore = uniqueCerts.reduce((sum, code) => {
    const found = CERTIFICATE_OPTIONS.find((item) => item.code === code);
    return sum + (found ? found.score : 0);
  }, 0);

  const validAwardCount = Math.max(0, Number(awardCount) || 0);
  const validProjectCount = Math.min(
    MAX_PROJECT_COUNT,
    Math.max(0, Number(projectCount) || 0)
  );

  const awardScore = validAwardCount * 3.0;
  const projectScore = validProjectCount * 1.5;
  const totalScore = Number(
    (certificateScore + awardScore + projectScore).toFixed(1)
  );

  let level = LEVEL.STARTER;
  if (totalScore >= 7.5) {
    level = LEVEL.ACHIEVER;
  } else if (totalScore >= 2.5) {
    level = LEVEL.BUILDER;
  }

  return {
    certificateScore: Number(certificateScore.toFixed(1)),
    awardScore: Number(awardScore.toFixed(1)),
    projectScore: Number(projectScore.toFixed(1)),
    totalScore,
    level,
  };
}

function ProfileTab() {
  // 서버 조회 및 저장 상태
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [urlError, setUrlError] = useState('');

  // 계정 기본 정보 (읽기 전용)
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');

  // 서버에 저장된 현재 학습 수준 (상단 배너 표시용)
  const [savedLearning, setSavedLearning] = useState({
    level: LEVEL.STARTER,
    totalScore: 0,
    certificateScore: 0,
    awardScore: 0,
    projectScore: 0,
  });

  // 기술 프로필 수정 상태
  const [intro, setIntro] = useState('');
  const [collaborationMode, setCollaborationMode] = useState(COLLABORATION_MODE.ONLINE);
  const [activeTimes, setActiveTimes] = useState([ACTIVE_TIME.WEEKDAY_NIGHT]);
  const [lookingForTeam, setLookingForTeam] = useState(true);
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // 학습 이력 수정 상태
  const [certificates, setCertificates] = useState([]);
  const [awardCount, setAwardCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);

  // 데이터 응답을 상태에 반영하는 헬퍼
  const applyUserData = useCallback((data) => {
    setEmail(data.email || '');
    setNickname(data.nickname || '');

    const profile = data.profile || {};
    setIntro(profile.intro || '');
    setCollaborationMode(profile.collaborationMode || COLLABORATION_MODE.ONLINE);
    setActiveTimes(
      Array.isArray(profile.activeTimes) && profile.activeTimes.length > 0
        ? profile.activeTimes
        : [ACTIVE_TIME.WEEKDAY_NIGHT]
    );
    setLookingForTeam(
      profile.lookingForTeam !== undefined ? Boolean(profile.lookingForTeam) : true
    );
    setPortfolioUrl(profile.portfolioUrl || '');

    const learning = data.learning || {};
    const loadedCerts = Array.isArray(learning.certificates)
      ? learning.certificates
      : [];
    const loadedAwards = Number(learning.awardCount ?? 0);
    const loadedProjects = Math.min(
      MAX_PROJECT_COUNT,
      Number(learning.projectCount ?? 0)
    );

    setCertificates(loadedCerts);
    setAwardCount(loadedAwards);
    setProjectCount(loadedProjects);

    const calculated = calculatePreviewLearning(
      loadedCerts,
      loadedAwards,
      loadedProjects
    );
    setSavedLearning({
      level: learning.level || data.level || calculated.level,
      totalScore:
        learning.totalScore !== undefined
          ? Number(learning.totalScore)
          : calculated.totalScore,
      certificateScore:
        learning.certificateScore !== undefined
          ? Number(learning.certificateScore)
          : calculated.certificateScore,
      awardScore:
        learning.awardScore !== undefined
          ? Number(learning.awardScore)
          : calculated.awardScore,
      projectScore:
        learning.projectScore !== undefined
          ? Number(learning.projectScore)
          : calculated.projectScore,
    });
  }, []);

  // 마운트 시 내 프로필 및 학습 이력 조회 (GET /api/users/me)
  const fetchMyProfile = useCallback(async () => {
    try {
      const resp = await getMeApi();
      applyUserData(resp.data.data);
    } catch (error) {
      const message =
        error.response?.data?.message || '프로필 정보를 불러오지 못했습니다.';
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  }, [applyUserData]);

  useEffect(() => {
    const initialFetchId = window.setTimeout(fetchMyProfile, 0);
    return () => window.clearTimeout(initialFetchId);
  }, [fetchMyProfile]);

  // 자격증 체크 토글
  const handleToggleCertificate = (code) => {
    setSuccessMessage('');
    setCertificates((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  };

  // 주요 활동 시간 체크 토글
  const handleToggleActiveTime = (code) => {
    setSuccessMessage('');
    setValidationError('');
    setActiveTimes((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  };

  // 실시간 예상 점수 및 레벨 계산
  const preview = calculatePreviewLearning(certificates, awardCount, projectCount);
  const markerPercent = Math.min(
    Math.max((preview.totalScore / MAX_BAR_SCORE) * 100, 0),
    100
  );

  // 산정 결과 카드 내부의 상세 내역 리스트
  const previewBreakdownItems = [
    ...CERTIFICATE_OPTIONS.filter((cert) => certificates.includes(cert.code)).map(
      (cert) => ({
        label: cert.label,
        scoreText: `+${formatScore(cert.score)}점`,
      })
    ),
    ...(awardCount > 0
      ? [
        {
          label: `대회 수상 ${awardCount}회`,
          scoreText: `+${formatScore(preview.awardScore)}점`,
        },
      ]
      : []),
    ...(projectCount > 0
      ? [
        {
          label: `프로젝트 완료 ${projectCount}개`,
          scoreText: `+${formatScore(preview.projectScore)}점`,
        },
      ]
      : []),
  ];

  // 변경사항 저장 (PUT /api/users/me)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setValidationError('');
    setSuccessMessage('');
    setUrlError('');

    const trimmedIntro = intro.trim();
    const trimmedUrl = portfolioUrl.trim();

    if (trimmedIntro.length > MAX_INTRO_LENGTH) {
      setValidationError(`한 줄 소개는 최대 ${MAX_INTRO_LENGTH}자까지 입력할 수 있습니다.`);
      return;
    }

    if (!collaborationMode) {
      setValidationError('협업 방식을 선택해주세요.');
      return;
    }

    if (activeTimes.length === 0) {
      setValidationError('주요 활동 시간을 최소 1개 이상 선택해야 합니다.');
      return;
    }

    if (trimmedUrl) {
      if (trimmedUrl.length > 500) {
        setUrlError('포트폴리오 URL은 500자 이하로 입력해 주세요.');
        return;
      }
      if (!URL_REGEX.test(trimmedUrl)) {
        setUrlError('깃허브 링크 주소만 입력할 수 있습니다.');
        return;
      }
    }

    setSaving(true);
    try {
      const resp = await updateProfileApi({
        intro: trimmedIntro || null,
        collaborationMode,
        activeTimes,
        lookingForTeam,
        portfolioUrl: trimmedUrl || null,
        certificates,
        awardCount,
        projectCount,
      });

      applyUserData(resp.data.data);
      setSuccessMessage('변경사항이 저장되었습니다.');
    } catch (error) {
      const message =
        error.response?.data?.message ||
        '변경사항 저장에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해주세요.';
      setValidationError(message);
    } finally {
      setSaving(false);
    }
  };

  // 1. 조회 중 상태
  if (loading) {
    return (
      <div className="profile-tab__status-box">
        <p className="profile-tab__status-text">프로필 정보를 불러오는 중입니다.</p>
      </div>
    );
  }

  // 2. 조회 실패 상태 (재시도 버튼 제공)
  if (fetchError) {
    return (
      <div className="profile-tab__status-box profile-tab__status-box--error" role="alert">
        <p className="profile-tab__status-text">{fetchError}</p>
        <button
          type="button"
          className="profile-tab__retry-btn"
          onClick={fetchMyProfile}
        >
          재시도
        </button>
      </div>
    );
  }

  return (
    <form className="profile-tab" onSubmit={handleSave} noValidate>
      {/* 상단 알림 메시지 영역 (오류 / 저장 성공) */}
      {validationError && (
        <div className="profile-tab__alert profile-tab__alert--error" role="alert">
          {validationError}
        </div>
      )}
      {successMessage && (
        <div className="profile-tab__alert profile-tab__alert--success" role="status">
          {successMessage}
        </div>
      )}

      {/* 1) 상단 배너: 현재 학습 수준 요약 */}
      <section className="profile-banner" aria-label="현재 학습 수준">
        <div className="profile-banner__left">
          <span className="profile-banner__title">현재 학습 수준</span>
          <span className="profile-banner__badge">{savedLearning.level}</span>
          <strong className="profile-banner__total">
            총 {formatScore(savedLearning.totalScore)}점
          </strong>
        </div>
        <div className="profile-banner__breakdown">
          <span>자격증 {formatScore(savedLearning.certificateScore)}점</span>
          <span className="profile-banner__dot">·</span>
          <span>대회 수상 {formatScore(savedLearning.awardScore)}점</span>
          <span className="profile-banner__dot">·</span>
          <span>프로젝트 완료 {formatScore(savedLearning.projectScore)}점</span>
        </div>
      </section>

      {/* 2) 기술 프로필 수정 카드 */}
      <section className="profile-card" aria-labelledby="tech-profile-heading">
        <div className="profile-card__header">
          <div>
            <h2 id="tech-profile-heading" className="profile-card__title">
              기술 프로필
            </h2>
          </div>
          <button
            type="submit"
            className="profile-card__save-btn"
            disabled={saving}
          >
            {saving ? '저장 중…' : '저장하기'}
          </button>
        </div>

        {/* 이메일 & 닉네임 (읽기 전용) */}
        <div className="profile-form__row">
          <div className="profile-form__field">
            <label htmlFor="profile-email" className="profile-form__label">
              이메일
            </label>
            <input
              id="profile-email"
              type="email"
              className="profile-form__input profile-form__input--readonly"
              value={email}
              readOnly
              disabled
            />
          </div>

          <div className="profile-form__field">
            <label htmlFor="profile-nickname" className="profile-form__label">
              닉네임
            </label>
            <input
              id="profile-nickname"
              type="text"
              className="profile-form__input profile-form__input--readonly"
              value={nickname}
              readOnly
              disabled
            />
          </div>
        </div>

        {/* 한 줄 소개 */}
        <div className="profile-form__field">
          <label htmlFor="profile-intro" className="profile-form__label">
            한 줄 소개
          </label>
          <input
            id="profile-intro"
            type="text"
            className="profile-form__input"
            maxLength={MAX_INTRO_LENGTH}
            value={intro}
            onChange={(e) => {
              setIntro(e.target.value);
              setSuccessMessage('');
            }}
            placeholder="나를 표현하는 한 줄 소개를 입력해 주세요 (최대 200자)"
          />
          <span className="profile-form__char-count">
            {intro.length} / {MAX_INTRO_LENGTH}
          </span>
        </div>

        {/* 협업 방식 & 주요 활동 시간 */}
        <div className="profile-form__row">
          <div className="profile-form__field">
            <span className="profile-form__label">협업 방식</span>
            <div className="profile-chip-group" role="radiogroup" aria-label="협업 방식">
              {COLLABORATION_OPTIONS.map((option) => {
                const isSelected = collaborationMode === option.code;
                return (
                  <button
                    key={option.code}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`profile-chip ${isSelected ? 'profile-chip--active' : ''
                      }`}
                    onClick={() => {
                      setCollaborationMode(option.code);
                      setSuccessMessage('');
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="profile-form__field">
            <span className="profile-form__label">주요 활동 시간</span>
            <div className="profile-chip-group" role="group" aria-label="주요 활동 시간">
              {ACTIVE_TIME_OPTIONS.map((option) => {
                const isSelected = activeTimes.includes(option.code);
                return (
                  <button
                    key={option.code}
                    type="button"
                    aria-pressed={isSelected}
                    className={`profile-chip ${isSelected ? 'profile-chip--active' : ''
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

        {/* 팀 구인 여부 토글 */}
        <div className="profile-toggle-box">
          <div className="profile-toggle-box__text">
            <strong className="profile-toggle-box__title">팀 구인 여부</strong>
            <p className="profile-toggle-box__desc">
              켜두면 팀원 찾기에 내 프로필이 노출되고 프로젝트 초대를 받을 수 있어요
            </p>
          </div>
          <label className="profile-switch" aria-label="팀 구인 여부">
            <input
              type="checkbox"
              checked={lookingForTeam}
              onChange={(e) => {
                setLookingForTeam(e.target.checked);
                setSuccessMessage('');
              }}
            />
            <span className="profile-switch__slider" />
          </label>
        </div>

        {/* 포트폴리오 URL (단일 입력) */}
        <div className="profile-form__field">
          <label htmlFor="profile-portfolio-url" className="profile-form__label">
            GitHUB URL
          </label>
          <input
            id="profile-portfolio-url"
            type="url"
            className="profile-form__input"
            value={portfolioUrl}
            onChange={(e) => {
              setPortfolioUrl(e.target.value);
              setSuccessMessage('');
            }}
            placeholder="https://github.com/username 주소"
          />
          {urlError && <p style={{ color: 'red', marginTop: '4px' }}>{urlError}</p>}
        </div>
      </section>

      {/* 3) 학습 점수 · 레벨 (학습 이력 수정 & 실시간 산정 결과 미리보기) */}
      <section className="profile-card" aria-labelledby="learning-score-heading">
        <div className="profile-card__header">
          <div>
            <h2 id="learning-score-heading" className="profile-card__title">
              학습 점수 · 레벨
            </h2>
            <p className="profile-card__subtitle">
              자격증과 수상 · 프로젝트 완료 횟수를 바꾸고 저장하면 총점과 레벨이 자동으로 다시 계산돼요
            </p>
          </div>
          <button
            type="submit"
            className="profile-card__save-btn"
            disabled={saving}
          >
            {saving ? '저장 중…' : '저장하기'}
          </button>
        </div>

        <div className="learning-layout">
          {/* 왼쪽: 자격증 체크박스 + 수상/프로젝트 카운터 */}
          <div className="learning-controls">
            <div className="profile-form__field">
              <span className="profile-form__label">보유 자격증</span>
              <div className="cert-grid">
                {CERTIFICATE_OPTIONS.map((cert) => {
                  const isChecked = certificates.includes(cert.code);
                  return (
                    <label
                      key={cert.code}
                      className={`cert-item ${isChecked ? 'cert-item--checked' : ''
                        }`}
                    >
                      <span className="cert-item__left">
                        <input
                          type="checkbox"
                          className="cert-item__checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCertificate(cert.code)}
                        />
                        <span className="cert-item__name">{cert.label}</span>
                      </span>
                      <span className="cert-item__point">{cert.pointText}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="counter-row">
              {/* 공식 SW 프로그래밍 대회 수상 */}
              <div className="counter-group">
                <label className="profile-form__label">
                  공식 SW 프로그래밍 대회 수상
                </label>
                <div className="counter-box">
                  <button
                    type="button"
                    className="counter-box__btn"
                    aria-label="대회 수상 횟수 감소"
                    onClick={() => {
                      setAwardCount((prev) => Math.max(0, prev - 1));
                      setSuccessMessage('');
                    }}
                  >
                    −
                  </button>
                  <span className="counter-box__value">{awardCount}회</span>
                  <button
                    type="button"
                    className="counter-box__btn"
                    aria-label="대회 수상 횟수 증가"
                    onClick={() => {
                      setAwardCount((prev) => prev + 1);
                      setSuccessMessage('');
                    }}
                  >
                    +
                  </button>
                  <span className="counter-box__badge">
                    +{formatScore(preview.awardScore)}점
                  </span>
                </div>
                <p className="counter-group__caption">1회당 3점 (중복 가능)</p>
              </div>

              {/* 해커톤 · 공모전 · 프로젝트 완료 */}
              <div className="counter-group">
                <label className="profile-form__label">
                  해커톤 · 공모전 · 프로젝트 완료
                </label>
                <div className="counter-box">
                  <button
                    type="button"
                    className="counter-box__btn"
                    aria-label="프로젝트 완료 횟수 감소"
                    onClick={() => {
                      setProjectCount((prev) => Math.max(0, prev - 1));
                      setSuccessMessage('');
                    }}
                  >
                    −
                  </button>
                  <span className="counter-box__value">{projectCount}개</span>
                  <button
                    type="button"
                    className="counter-box__btn"
                    aria-label="프로젝트 완료 횟수 증가"
                    onClick={() => {
                      setProjectCount((prev) =>
                        Math.min(MAX_PROJECT_COUNT, prev + 1)
                      );
                      setSuccessMessage('');
                    }}
                  >
                    +
                  </button>
                  <span className="counter-box__badge">
                    +{formatScore(preview.projectScore)}점
                  </span>
                </div>
                <p className="counter-group__caption">
                  1개당 1.5점 (최대 4.5점)
                </p>
              </div>
            </div>
          </div>

          {/* 오른쪽: 실시간 산정 결과 미리보기 박스 */}
          <aside className="preview-box" aria-label="실시간 예상 점수 및 레벨 산정 결과">
            <div className="preview-box__header">
              <span className="preview-box__title">산정 결과</span>
              <span className="preview-box__badge">{preview.level}</span>
            </div>

            <div className="preview-box__score">
              <strong className="preview-box__number">
                {formatScore(preview.totalScore)}
              </strong>
              <span className="preview-box__unit">점</span>
            </div>

            {/* 레벨 게이지 바 (10점 만점 기준) */}
            <div className="preview-gauge">
              <div className="preview-gauge__track">
                <div className="preview-gauge__seg preview-gauge__seg--starter" />
                <div className="preview-gauge__seg preview-gauge__seg--builder" />
                <div className="preview-gauge__seg preview-gauge__seg--achiever" />
              </div>
              <div
                className="preview-gauge__pin"
                style={{ left: `${markerPercent}%` }}
                aria-hidden="true"
              />
            </div>

            <div className="preview-gauge__labels">
              <span>{LEVEL.STARTER}</span>
              <span>{LEVEL.BUILDER}</span>
              <span>{LEVEL.ACHIEVER}</span>
            </div>

            <hr className="preview-box__divider" />

            {/* 선택된 이력 항목별 점수 리스트 */}
            <ul className="preview-list">
              {previewBreakdownItems.length > 0 ? (
                previewBreakdownItems.map((item, idx) => (
                  <li key={idx} className="preview-list__item">
                    <span className="preview-list__label">{item.label}</span>
                    <strong className="preview-list__value">
                      {item.scoreText}
                    </strong>
                  </li>
                ))
              ) : (
                <li className="preview-list__item">
                  <span className="preview-list__label">선택된 학습 이력 없음</span>
                  <strong className="preview-list__value">+0점</strong>
                </li>
              )}
            </ul>
          </aside>
        </div>
      </section>
    </form>
  );
}

export default ProfileTab;

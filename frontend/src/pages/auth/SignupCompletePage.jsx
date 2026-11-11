// SCR-06 회원가입 완료 (박도영)
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  CERTIFICATE,
  CERTIFICATE_OPTIONS,
  LEVEL,
} from '../../constants';
import { findLabel, toArray } from '../../utils/format';
import './SignupCompletePage.css';

const CERTIFICATE_SCORES = {
  [CERTIFICATE.ENGINEER]: 2,
  [CERTIFICATE.INDUSTRIAL]: 1,
  [CERTIFICATE.SQLD]: 1,
  [CERTIFICATE.LINUX]: 1,
  [CERTIFICATE.PROGRAMMING]: 0.5,
  [CERTIFICATE.ADSP]: 0.5,
};

const MAX_BAR_SCORE = 10;

// 점수가 정수면 정수로, 소수면 소수점 첫째 자리까지 표시
function formatScore(score) {
  const num = Number(score) || 0;
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function SignupCompletePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // 회원가입 직후 넘어온 state 또는 로그인된 사용자 정보 사용
  const stateData = location.state || {};
  const user = stateData.user || authUser || {};
  const learning = stateData.learning || user.learning || {};

  const nickname = user.nickname || '회원';
  const totalScore = Number(learning.totalScore ?? user.totalScore ?? 0);

  // totalScore에 따른 level 결정 (백엔드 level 값이 있으면 우선 사용)
  const level =
    learning.level ||
    user.level ||
    (totalScore >= 7.5
      ? LEVEL.ACHIEVER
      : totalScore >= 2.5
        ? LEVEL.BUILDER
        : LEVEL.STARTER);

  // 바 위치 계산 (최대 10점 기준, 10점 이상이면 100%로 동일)
  const markerPercent = Math.min(
    Math.max((totalScore / MAX_BAR_SCORE) * 100, 0),
    100
  );

  // 산정 내역 리스트 구성
  const certificates = toArray(learning.certificates);
  const awardCount = Number(learning.awardCount ?? 0);
  const projectCount = Number(learning.projectCount ?? 0);
  const awardScore = Number(learning.awardScore ?? awardCount * 3);
  const projectScore = Number(
    learning.projectScore ?? Math.min(projectCount, 3) * 1.5
  );

  const historyItems = [
    ...certificates
      .filter((code) => CERTIFICATE_SCORES[code] != null)
      .map((code) => ({
        label: findLabel(CERTIFICATE_OPTIONS, code),
        scoreText: `+${formatScore(CERTIFICATE_SCORES[code])}점`,
      })),
    ...(awardCount > 0
      ? [
        {
          label: `대회 수상 ${awardCount}회`,
          scoreText: `+${formatScore(awardScore)}점`,
        },
      ]
      : []),
    ...(projectCount > 0
      ? [
        {
          label: `프로젝트 완료 ${projectCount}개`,
          scoreText: `+${formatScore(projectScore)}점`,
        },
      ]
      : []),
  ];

  const levelBadgeClass =
    level === LEVEL.STARTER
      ? 'signup-complete-card__level-badge--starter'
      : level === LEVEL.ACHIEVER
        ? 'signup-complete-card__level-badge--achiever'
        : 'signup-complete-card__level-badge--builder';

  return (
    <main className="signup-complete-page">
      {/* 메인 카드 */}
      <div className="signup-complete-card">
        {/* 상단 체크 표시 및 제목 */}
        <div className="signup-complete-card__check-icon">✓</div>
        <h2 className="signup-complete-card__title">가입이 완료되었어요</h2>
        <p className="signup-complete-card__subtitle">
          입력한 학습 이력으로 산정된 {nickname} 님의 레벨이에요
        </p>

        {/* 산정 결과 박스 */}
        <div className="signup-complete-card__result-box">
          {/* 상단: 산정 결과 & 레벨 배지 */}
          <div className="signup-complete-card__result-header">
            <strong className="signup-complete-card__result-title">산정 결과</strong>
            <span className={`signup-complete-card__level-badge ${levelBadgeClass}`}>
              {level}
            </span>
          </div>

          {/* 총점 표시 */}
          <div className="signup-complete-card__score-container">
            <strong className="signup-complete-card__score-value">{formatScore(totalScore)}</strong>{' '}
            <span className="signup-complete-card__score-unit">점</span>
          </div>

          {/* 레벨 게이지 바 (최대 10점 기준) */}
          <div className="signup-complete-card__gauge">
            <div className="signup-complete-card__gauge-track">
              {/* STARTER (0 ~ 2.5점: 25%) */}
              <div className="signup-complete-card__gauge-segment signup-complete-card__gauge-segment--starter" />
              {/* BUILDER (2.5 ~ 7.5점: 50%) */}
              <div className="signup-complete-card__gauge-segment signup-complete-card__gauge-segment--builder" />
              {/* ACHIEVER (7.5 ~ 10점: 25%) */}
              <div className="signup-complete-card__gauge-segment signup-complete-card__gauge-segment--achiever" />
            </div>

            {/* 현재 점수 위치 핀 */}
            <div
              className="signup-complete-card__gauge-marker"
              style={{ left: `${markerPercent}%` }}
            />
          </div>

          {/* 구간 이름 */}
          <div className="signup-complete-card__gauge-labels">
            <span>{LEVEL.STARTER}</span>
            <span>{LEVEL.BUILDER}</span>
            <span>{LEVEL.ACHIEVER}</span>
          </div>

          <hr className="signup-complete-card__divider" />

          {/* 입력한 학습 이력별 점수 목록 */}
          <div className="signup-complete-card__history-list">
            {historyItems.length > 0 ? (
              historyItems.map((item, idx) => (
                <div key={idx} className="signup-complete-card__history-item">
                  <span className="signup-complete-card__history-label">{item.label}</span>
                  <strong className="signup-complete-card__history-score">{item.scoreText}</strong>
                </div>
              ))
            ) : (
              <div className="signup-complete-card__history-empty">
                <span>입력한 학습 이력 없음</span>
                <strong>+0점</strong>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="signup-complete-card__actions">
          <button
            type="button"
            className="signup-complete-card__btn signup-complete-card__btn--secondary"
            onClick={() => navigate('/mypage')}
          >
            마이페이지에서 확인
          </button>

          <button
            type="button"
            className="signup-complete-card__btn signup-complete-card__btn--primary"
            onClick={() => navigate('/login')}
          >
            PIECE 시작하기
          </button>
        </div>
      </div>

      {/* 하단 푸터 */}
      <p className="signup-complete-footer">
        PIECE · 6팀 DevMates
      </p>
    </main>
  );
}

export default SignupCompletePage;

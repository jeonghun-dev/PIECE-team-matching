// SCR-06 회원가입 완료 (박도영)
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  CERTIFICATE,
  CERTIFICATE_OPTIONS,
  LEVEL,
} from '../../constants';

const CERTIFICATE_SCORES = {
  [CERTIFICATE.ENGINEER]: 2,
  [CERTIFICATE.INDUSTRIAL]: 1,
  [CERTIFICATE.SQLD]: 1,
  [CERTIFICATE.LINUX]: 1,
  [CERTIFICATE.PROGRAMMING]: 0.5,
  [CERTIFICATE.ADSP]: 0.5,
};

const CERTIFICATE_INFO = Object.fromEntries(
  CERTIFICATE_OPTIONS.map((item) => [
    item.code,
    { label: item.label, score: CERTIFICATE_SCORES[item.code] ?? 0 },
  ])
);

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
  const certificates = Array.isArray(learning.certificates)
    ? learning.certificates
    : [];
  const awardCount = Number(learning.awardCount ?? 0);
  const projectCount = Number(learning.projectCount ?? 0);
  const awardScore = Number(learning.awardScore ?? awardCount * 3);
  const projectScore = Number(
    learning.projectScore ?? Math.min(projectCount, 3) * 1.5
  );

  const historyItems = [
    ...certificates
      .filter((code) => CERTIFICATE_INFO[code])
      .map((code) => ({
        label: CERTIFICATE_INFO[code].label,
        scoreText: `+${formatScore(CERTIFICATE_INFO[code].score)}점`,
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

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 24px' }}>
      {/* 메인 카드 */}
      <div
        style={{
          border: '1px solid #e5e9f2',
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        {/* 상단 체크 표시 및 제목 */}
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>✓</div>
        <h2>가입이 완료되었어요</h2>
        <p style={{ marginTop: '8px', marginBottom: '24px' }}>
          입력한 학습 이력으로 산정된 {nickname} 님의 레벨이에요
        </p>

        {/* 산정 결과 박스 */}
        <div
          style={{
            border: '1px solid #e5e9f2',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'left',
            marginBottom: '24px',
          }}
        >
          {/* 상단: 산정 결과 & 레벨 배지 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <strong>산정 결과</strong>
            <span
              style={{
                backgroundColor: '#4054FF',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {level}
            </span>
          </div>

          {/* 총점 표시 */}
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ fontSize: '32px' }}>{formatScore(totalScore)}</strong>{' '}
            <span>점</span>
          </div>

          {/* 레벨 게이지 바 (최대 10점 기준) */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                height: '10px',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              {/* STARTER (0 ~ 2.5점: 25%) */}
              <div style={{ width: '25%', backgroundColor: '#b7ebd8' }} />
              {/* BUILDER (2.5 ~ 7.5점: 50%) */}
              <div style={{ width: '50%', backgroundColor: '#c5d0ff' }} />
              {/* ACHIEVER (7.5 ~ 10점: 25%) */}
              <div style={{ width: '25%', backgroundColor: '#ffd0c2' }} />
            </div>

            {/* 현재 점수 위치 핀 */}
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                left: `${markerPercent}%`,
                transform: 'translateX(-50%)',
                width: '4px',
                height: '18px',
                backgroundColor: '#20243E',
                borderRadius: '2px',
              }}
            />
          </div>

          {/* 구간 이름 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            <span>{LEVEL.STARTER}</span>
            <span>{LEVEL.BUILDER}</span>
            <span>{LEVEL.ACHIEVER}</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e9f2', margin: '16px 0' }} />

          {/* 입력한 학습 이력별 점수 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {historyItems.length > 0 ? (
              historyItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{item.label}</span>
                  <strong>{item.scoreText}</strong>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>입력한 학습 이력 없음</span>
                <strong>+0점</strong>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/mypage')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e9f2',
              backgroundColor: '#FFFFFF',
              color: '#030303aa',
              cursor: 'pointer',
            }}
          >
            마이페이지에서 확인
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4054FF',
              color: '#FFFFFF',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            PIECE 시작하기
          </button>
        </div>
      </div>

      {/* 하단 푸터 */}
      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px' }}>
        PIECE · 6팀 DevMates
      </p>
    </div>
  );
}

export default SignupCompletePage;
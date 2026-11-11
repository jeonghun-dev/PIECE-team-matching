/* 
validateSignupInput(...)
validateLoginInput(...)
validateProfileInput(...)
*/
const { COLLABORATION_MODE, ACTIVE_TIME, CERTIFICATE } = require("../constants");
const { createError } = require("../utils/createError");
const ALLOWED_COLLABORATION_MODES = Object.values(COLLABORATION_MODE);// 협업 방식
const ALLOWED_ACTIVE_TIMES = Object.values(ACTIVE_TIME);// 활동 시간
const ALLOWED_CERTIFICATES = Object.values(CERTIFICATE);// 자격증 목록

// 정규표현식
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_-]{2,30}$/;
// 영문, 숫자, 특수문자를 각각 최소 1개 이상 포함하고 8자 이상 (NFR-014)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const URL_REGEX = /^https?:\/\/.+/i;

// 프로필 및 학습 이력 공통 필드 검증 (회원가입 & 프로필 수정 공용)
function validateProfileAndHistoryFields(body = {}, { isSignup = false } = {}) { // 회원이 아니다 = 빈 배열 초기화
  const {
    intro,
    collaborationMode,
    activeTimes,
    lookingForTeam,
    portfolioUrl,
    certificates,
    awardCount,
    projectCount,
  } = body; // 구조분해할당

  // 한 줄 소개 (선택 입력, 최대 200자)
  if (intro !== undefined && intro !== null && intro !== '') {  // 값 존재 여부
    if (typeof intro !== 'string' || intro.length > 200) {  // 글자 크기 제한 catch
      throw createError(400, '한 줄 소개는 200자 이하의 문자열이어야 합니다.');
    }
  }

  // 협업 방식 (ONLINE / OFFLINE / ANY)
  if (
    !collaborationMode ||
    !ALLOWED_COLLABORATION_MODES.includes(collaborationMode)
  ) {
    throw createError(
      400,
      '협업 방식은 ONLINE, OFFLINE, ANY 중 하나여야 합니다.'
    );
  }

  // 주요 활동 시간 (4종 중 1개 이상 선택)
  // const A = B ? C : D ? E : []; : B가 false면 D, D가 false면 [].
  const parsedActiveTimes = Array.isArray(activeTimes)
    ? activeTimes   // 배열이 있다면, 그 값 그대로
    : typeof activeTimes === 'string' && activeTimes.trim() !== ''  // 없다면, string에 공백없는지 = 값은 있다
      ? activeTimes.split(',').map((t) => t.trim())   // 배열로 만들기
      : [];   // 그 외 상황은 빈 배열

  if (parsedActiveTimes.length === 0) {
    throw createError(400, '주요 활동 시간을 최소 1개 이상 선택해야 합니다.');
  }
  const hasInvalidTime = parsedActiveTimes.some(
    (time) => !ALLOWED_ACTIVE_TIMES.includes(time)
  );
  if (hasInvalidTime) {
    throw createError(400, '유효하지 않은 주요 활동 시간 값이 포함되어 있습니다.');
  }

  // 팀 구인 여부 검증
  if (
    lookingForTeam !== undefined &&
    typeof lookingForTeam !== 'boolean' &&
    lookingForTeam !== 0 &&
    lookingForTeam !== 1
  ) {
    throw createError(400, '팀 구인 여부 값이 올바르지 않습니다.');
  }

  // NFR-022: 포트폴리오 URL (선택 입력, http(s):// 형식, 최대 500자)
  if (portfolioUrl !== undefined && portfolioUrl !== null && portfolioUrl !== '') {
    if (
      typeof portfolioUrl !== 'string' ||
      portfolioUrl.length > 500 ||
      !URL_REGEX.test(portfolioUrl.trim())
    ) {
      throw createError(
        400,
        '포트폴리오 URL은 http:// 또는 https://로 시작하는 500자 이하 주소여야 합니다.'
      );
    }
  }

  // NFR-018: 자격증 (정해진 6종 내에서만 선택, 중복 선택 불가)
  if (certificates !== undefined && certificates !== null && certificates !== '') {
    const certList = Array.isArray(certificates)
      ? certificates
      : typeof certificates === 'string'
        ? certificates
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
        : null;

    if (!certList) {
      throw createError(400, '보유 자격증 형식이 올바르지 않습니다.');
    }
    if (new Set(certList).size !== certList.length) {
      throw createError(400, '같은 자격증을 중복해서 선택할 수 없습니다.');
    }
    const hasInvalidCert = certList.some(
      (cert) => !ALLOWED_CERTIFICATES.includes(cert)
    );
    if (hasInvalidCert) {
      throw createError(
        400,
        '보유 자격증은 지정된 6종(ENGINEER, INDUSTRIAL, SQLD, LINUX, PROGRAMMING, ADSP)만 선택할 수 있습니다.'
      );
    }
  }

  // 대회 수상 및 프로젝트 완료 횟수 (0 이상 10 이하의 정수)
  const parsedAwardCount =
    awardCount === undefined || awardCount === '' ? (isSignup ? 0 : undefined) : Number(awardCount);
  if (
    parsedAwardCount !== undefined &&
    (!Number.isInteger(parsedAwardCount) || parsedAwardCount < 0 || parsedAwardCount > 10)
  ) {
    throw createError(400, '대회 수상 횟수는 0 이상 10 이하의 정수여야 합니다.');
  }

  const parsedProjectCount =
    projectCount === undefined || projectCount === ''
      ? isSignup
        ? 0
        : undefined
      : Number(projectCount);
  if (
    parsedProjectCount !== undefined &&
    (!Number.isInteger(parsedProjectCount) || parsedProjectCount < 0 || parsedProjectCount > 10)
  ) {
    throw createError(400, '프로젝트 완료 횟수는 0 이상 10 이하의 정수여야 합니다.');
  }
}

// 회원가입 입력값 검증 미들웨어
const validateSignupInput = (req, res, next) => {
  try {
    // 기존 로직 동일

    const {
      email,
      nickname,
      password,
      passwordConfirm,
      termsAgreed,
      privacyAgreed,
    } = req.body || {};

    // 이메일 검증
    if (
      !email ||
      typeof email !== 'string' ||
      email.trim().length > 100 ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      throw createError(400, '유효한 이메일 주소를 입력해주세요. (최대 100자)');
    }

    // 닉네임 검증
    if (
      !nickname ||
      typeof nickname !== 'string' ||
      !NICKNAME_REGEX.test(nickname.trim())
    ) {
      throw createError(
        400,
        '닉네임은 2~30자의 한글, 영문, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있습니다.'
      );
    }

    // 비밀번호 검증
    if (!password || typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
      throw createError(
        400,
        '비밀번호는 영문, 숫자, 특수문자를 모두 포함하여 8자 이상이어야 합니다.'
      );
    }

    // 비밀번호 확인 일치 검증
    if (password !== passwordConfirm) {
      throw createError(400, '비밀번호와 비밀번호 확인이 일치하지 않습니다.');
    }

    // 필수 약관 동의 검증 (서비스 이용약관, 개인정보 수집·이용)
    if (!termsAgreed || !privacyAgreed) {
      throw createError(
        400,
        '서비스 이용약관 및 개인정보 수집·이용에 모두 동의해야 가입할 수 있습니다.'
      );
    }

    // 초기 프로필 및 학습 이력 입력값 검증
    validateProfileAndHistoryFields(req.body, { isSignup: true });
    return next();
  } catch (error) {
    return next(error);
  }
};

// 로그인 입력값 검증 미들웨어 (REQ-USR-002, NFR-017)
const validateLoginInput = (req, res, next) => {
  try {
    // 기존 로직 동일
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw createError(400, '이메일을 입력해주세요.');
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      throw createError(400, '올바른 이메일 형식을 입력해주세요.');
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      throw createError(400, '비밀번호를 입력해주세요.');
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

// 내 프로필 및 학습 이력 수정 입력값 검증 미들웨어
const validateProfileInput = (req, res, next) => {
  try {
    // 기존 로직 동일

    if (!req.body || typeof req.body !== 'object') {
      throw createError(400, '수정할 프로필 데이터를 입력해주세요.');
    }

    validateProfileAndHistoryFields(req.body, { isSignup: false });
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  validateSignupInput,
  validateLoginInput,
  validateProfileInput,
  ALLOWED_COLLABORATION_MODES,
  ALLOWED_ACTIVE_TIMES,
  ALLOWED_CERTIFICATES,
};
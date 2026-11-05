/**
 * AccountService: 회원 가입·로그인·인증 확인 및 기술 프로필·학습 레벨 비즈니스 로직
 * 담당: 박도영
 * 구분: 필수, 추가 기능
 * - 필수(MVP): signup, login, logout, assertActive
 * - 추가 기능: getMe, getLevel, getMemberProfile, updateProfile
 * 규칙: 모든 비즈니스 오류 생성 시 상태 코드는 error.status로 통일한다.
 */
const bcrypt = require('bcrypt');   // 비밀번호 암호화
const jwt = require('jsonwebtoken');    // JWT 토큰 발행
const User = require('../models/user');
const Profile = require('../models/profile');
const LearningHistory = require('../models/learningHistory');
const LevelPolicy = require('../policies/levelPolicy.js');
const AccountRepository = require('../repositories/accountRepository.js'); // DB 와 실제 작업을 함.

const SALT_ROUNDS = 10; // bycript 암호화 시 사용. 높을수록 암호하는 좋지만 성능이 떨어진다.
const TOKEN_EXPIRES_IN = '1h'; // 액세스 토큰 유지 기간

// 공통 에러 생성 함수 (error.status 통일) 
function createServiceError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

class AccountService {  // 이 서비스 객체가 생성될 때, DB 와 연동된 repository 가 만들어진다 => repository라는 계층이 하는 일 : DB와 데이터 통신
  constructor(repository = new AccountRepository(), levelPolicy = new LevelPolicy()) {
    this.repository = repository;
    this.levelPolicy = levelPolicy;
  }

  // 회원가입 처리
  async signup(input) { // input : req.body
    const email = input.email.trim().toLowerCase(); // 대소문자 구분 안하기 때문
    const nickname = input.nickname.trim(); 

    // 1. DB 진입 전 이메일·닉네임 중복 검사
    const existingEmail = await this.repository.findByEmail(email); // 이메일 값을 DB에서 추출
    if (existingEmail) {    // 이미 존재하는 경우
      throw createServiceError(409, '이미 사용 중인 이메일입니다.');
    }

    const existingNickname = await this.repository.findByNickname(nickname);
    if (existingNickname) { // 이미 존재하는 경우
      throw createServiceError(409, '이미 사용 중인 닉네임입니다.');
    }

    // 2. 필수: bcrypt 비밀번호 해시 (비밀번호 암호화 후 저장 예정)
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);    // 2^salt 회 수행

    // 3. 학습 이력 기반 점수/레벨 계산 
    const levelResult = this.levelPolicy.calculate({
      certificates: input.certificates || [],
      awardCount: input.awardCount ?? 0,
      projectCount: input.projectCount ?? 0,
    });

    // 4. DB 저장 및 UNIQUE 제약조건 충돌(ER_DUP_ENTRY) 시 409 변환
    let userId;
    try {
      userId = await this.repository.createUser({
        email,
        nickname,
        passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        intro: input.intro ? input.intro.trim() : null,
        collaborationMode: input.collaborationMode,
        activeTimes: input.activeTimes,
        lookingForTeam:
          input.lookingForTeam !== undefined ? Boolean(input.lookingForTeam) : true,
        portfolioUrl: input.portfolioUrl ? input.portfolioUrl.trim() : null,
        certificates: levelResult.certificates,
        awardCount: levelResult.awardCount,
        projectCount: levelResult.projectCount,
        totalScore: levelResult.totalScore,
        level: levelResult.level,
      });
    } catch (dbErr) {
      if (dbErr && (dbErr.code === 'ER_DUP_ENTRY' || dbErr.errno === 1062)) {
        throw createServiceError(409, '이미 사용 중인 이메일 또는 닉네임입니다.');
      }
      throw dbErr;
    }

    const createdRow = await this.repository.findById(userId);
    const user = User.fromRow(createdRow);
    const profile = Profile.fromRow(createdRow);

    return {
      user: user.toMeJSON(),
      profile: profile.toJSON(),
      learning: levelResult, // 가입 완료 화면(SCR-06)용 총점·레벨·항목별 점수 포함
    };
  }

  // 로그인 처리 및 JWT(유지 1시간) 발급
  async login(credentials) {
    const email = credentials.email.trim().toLowerCase();
    const row = await this.repository.findByEmail(email);

    if (!row) {
      throw createServiceError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordMatched = await bcrypt.compare(
      credentials.password,
      row.password_hash
    );
    if (!isPasswordMatched) {
      throw createServiceError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 추가 기능: 활동 정지 회원 로그인 차단 (NFR-008)
    if (row.status === 'SUSPENDED') {
      throw createServiceError(403, '운영 정책 위반으로 활동이 정지된 계정입니다.');
    }

    const payload = {
      id: row.id,
      nickname: row.nickname,
      role: row.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES_IN,
    });

    const user = User.fromRow(row);
    const learning = LearningHistory.fromRow(row);

    return {
      token,
      user: {
        ...user.toMeJSON(),
        level: learning.level,
        totalScore: learning.totalScore,
      },
    };
  }

  // 로그아웃 처리 - 서버 토큰 폐기 테이블 없이 클라이언트 토큰 제거
  async logout(actor) {
    if (!actor || !actor.id) {
      throw createServiceError(401, '로그인이 필요합니다.');
    }
    return {
      loggedOut: true,
    };
  }

  // 인증 미들웨어용 회원 활성 상태 확인
  async assertActive(userId) {
    if (!userId) {
      throw createServiceError(401, '유효하지 않은 인증 정보입니다.');
    }

    const row = await this.repository.findById(userId);
    if (!row) {
      throw createServiceError(401, '존재하지 않는 회원입니다.');
    }

    if (row.status === 'SUSPENDED') {
      throw createServiceError(403, '활동이 정지된 계정입니다.');
    }

    return {
      id: row.id,
      email: row.email,
      nickname: row.nickname,
      role: row.role,
      status: row.status,
      level: row.level,
    };
  }

  // 추가 기능: 내 정보(기본 계정 + 기술 프로필 + 학습 이력·점수) 통합 조회
  async getMe(actor) {
    const row = await this.repository.findById(actor.id);
    if (!row) {
      throw createServiceError(404, '회원 정보를 찾을 수 없습니다.');
    }

    const user = User.fromRow(row);
    const profile = Profile.fromRow(row);
    const history = LearningHistory.fromRow(row);
    const breakdown = this.levelPolicy.calculate(history);

    return {
      ...user.toMeJSON(),
      level: breakdown.level,
      totalScore: breakdown.totalScore, 
      profile: profile.toJSON(),
      learning: breakdown,
    };
  }

  // 추가 기능: 내 학습 점수(항목별 배점·총점) 및 3단계 레벨 상세 조회
  async getLevel(actor) {
    const row = await this.repository.findById(actor.id);
    if (!row) {
      throw createServiceError(404, '회원 정보를 찾을 수 없습니다.');
    }

    const history = LearningHistory.fromRow(row);
    return this.levelPolicy.calculate(history);
  }

  // 추가 기능: 타 사용자 공개 프로필 조회 - 팀원 상세 화면용, 이메일·비밀번호 해시 제외
  async getMemberProfile(id) {
    const memberId = Number(id);
    if (!Number.isInteger(memberId) || memberId <= 0) {
      throw createServiceError(400, '유효하지 않은 회원 번호입니다.');
    }

    const row = await this.repository.findById(memberId);
    if (!row || row.status === 'SUSPENDED') {
      throw createServiceError(404, '존재하지 않거나 활동이 제한된 회원입니다.');
    }

    const user = User.fromRow(row);
    const profile = Profile.fromRow(row);
    const history = LearningHistory.fromRow(row);
    const breakdown = this.levelPolicy.calculate(history);

    return {
      ...user.toPublicJSON(),
      profile: profile.toJSON(),
      learning: breakdown,
    };
  }

  // 추가 기능: 내 기술 프로필 및 학습 이력 수정 (이력·총점·레벨을 단일 UPDATE로 함께 갱신
  async updateProfile(actor, input) {
    const currentRow = await this.repository.findById(actor.id);
    if (!currentRow) {
      throw createServiceError(404, '회원 정보를 찾을 수 없습니다.');
    }

    const currentHistory = LearningHistory.fromRow(currentRow);

    // 입력된 학습 이력(미입력 시 기존 값 유지)을 바탕으로 점수·레벨 재산출
    const levelResult = this.levelPolicy.calculate({
      certificates:
        input.certificates !== undefined
          ? input.certificates
          : currentHistory.certificates,
      awardCount:
        input.awardCount !== undefined
          ? input.awardCount
          : currentHistory.awardCount,
      projectCount:
        input.projectCount !== undefined
          ? input.projectCount
          : currentHistory.projectCount,
    });

    // 프로필과 학습 이력·총점·레벨을 하나의 UPDATE로 저장
    await this.repository.updateProfile(actor.id, {
      intro: input.intro ? input.intro.trim() : null,
      collaborationMode: input.collaborationMode,
      activeTimes: input.activeTimes,
      lookingForTeam:
        input.lookingForTeam !== undefined
          ? Boolean(input.lookingForTeam)
          : Boolean(currentRow.looking_for_team),
      portfolioUrl: input.portfolioUrl ? input.portfolioUrl.trim() : null,
      certificates: levelResult.certificates,
      awardCount: levelResult.awardCount,
      projectCount: levelResult.projectCount,
      totalScore: levelResult.totalScore,
      level: levelResult.level,
    });

    return this.getMe(actor);
  }
}

module.exports = AccountService;

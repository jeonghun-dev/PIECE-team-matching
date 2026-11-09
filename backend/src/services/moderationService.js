// 신고, 관리자 기능 업무 규칙
const pool = require("../config/db");
const moderationRepository = require("../repositories/moderationRepository");
const projectRepository = require("../repositories/projectRepository");
const {
  REPORT_TARGET_TYPE,
  REPORT_REASON,
  REPORT_STATUS,
  USER_ROLE,
  USER_STATUS,
  PROJECT_STATUS,
} = require("../constants");
const { getPagination, toPageResponse } = require("../utils/pagination");

const DETAIL_MAX_LENGTH = 500;

// 공통 에러 처리 미들웨어에 전달할 오류 생성
const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// 신고 요청 본문 검사 후 정리된 값 반환
const parseReportInput = (input) => {
  const targetType = input?.targetType;
  const reason = input?.reason;
  const targetId = Number(input?.targetId);

  if (!Object.values(REPORT_TARGET_TYPE).includes(targetType)) {
    throw createError(400, "신고 대상 종류가 올바르지 않습니다.");
  }

  if (!Number.isSafeInteger(targetId) || targetId < 1) {
    throw createError(400, "신고 대상 번호가 올바르지 않습니다.");
  }

  if (!Object.values(REPORT_REASON).includes(reason)) {
    throw createError(400, "신고 사유가 올바르지 않습니다.");
  }

  // 상세 내용은 선택 입력, 비어 있으면 null로 저장
  let detail = input?.detail ?? null;

  if (detail !== null) {
    if (typeof detail !== "string") {
      throw createError(400, "상세 내용 형식이 올바르지 않습니다.");
    }

    detail = detail.trim();

    if (detail.length > DETAIL_MAX_LENGTH) {
      throw createError(
        400,
        `상세 내용은 ${DETAIL_MAX_LENGTH}자 이하로 입력해 주세요.`,
      );
    }

    if (detail === "") {
      detail = null;
    }
  }

  return { targetType, targetId, reason, detail };
};

// 신고 접수
const report = async (actor, input) => {
  if (!actor?.id) {
    throw createError(401, "로그인이 필요합니다.");
  }

  const { targetType, targetId, reason, detail } = parseReportInput(input);

  const target = await moderationRepository.findTarget(targetType, targetId);

  if (!target) {
    throw createError(404, "신고 대상을 찾을 수 없습니다.");
  }

  if (String(target.authorId) === String(actor.id)) {
    throw createError(403, "본인이 작성한 글은 신고할 수 없습니다.");
  }

  let reportId;

  try {
    reportId = await moderationRepository.saveReport({
      reporterId: actor.id,
      targetType,
      targetId,
      reason,
      detail,
    });
  } catch (error) {
    // uk_reports_once: 같은 대상은 한 사람당 1회만 신고
    if (error.code === "ER_DUP_ENTRY") {
      throw createError(409, "이미 신고한 대상입니다.");
    }

    throw error;
  }

  return {
    id: reportId,
    targetType,
    targetId,
    reason,
    detail,
    status: REPORT_STATUS.PENDING,
  };
};

//  ---------------- 관리자 공통 ----------------
// 관리자 권한 재확인 (라우터 requireAdmin과 별개로 서버에서 한 번 더 검사)
const assertAdmin = (actor) => {
  if (!actor?.id) {
    throw createError(401, "로그인이 필요합니다.");
  }

  if (actor.role !== USER_ROLE.ADMIN) {
    throw createError(403, "관리자 권한이 필요합니다.");
  }
};

// URL로 받은 번호 검사
const parseId = (id, name) => {
  const value = Number(id);

  if (!Number.isSafeInteger(value) || value < 1) {
    throw createError(400, `${name} 번호가 올바르지 않습니다.`);
  }

  return value;
};

// 목록 필터 값 검사: 비어 있으면 전체, 있으면 허용 목록 안의 값만
const parseFilter = (value, allowed, message) => {
  if (value === undefined || value === "") {
    return null;
  }

  if (!Object.values(allowed).includes(value)) {
    throw createError(400, message);
  }

  return value;
};

// 페이지 번호가 너무 커서 OFFSET 계산이 깨지는 경우 차단
const parsePaging = (query) => {
  const paging = getPagination(query);

  if (!Number.isSafeInteger(paging.offset)) {
    throw createError(400, "페이지 범위가 너무 큽니다.");
  }

  return paging;
};

// ---------------- 관리자: 회원 ----------------

// 전체 회원 목록 (상태·이메일/닉네임 검색, 페이지)
const listUsers = async (admin, query = {}) => {
  assertAdmin(admin);

  const paging = parsePaging(query);
  const filters = {
    status: parseFilter(
      query.status,
      USER_STATUS,
      "회원 상태 값이 올바르지 않습니다.",
    ),
    keyword: typeof query.keyword === "string" ? query.keyword.trim() : "",
  };

  const totalCount = await moderationRepository.countUsers(filters);
  const users = await moderationRepository.findUsers(
    filters,
    paging.limit,
    paging.offset,
  );

  const items = users.map((user) => ({
    ...user,
    score: Number(user.score),
    reportCount: Number(user.reportCount),
  }));

  return toPageResponse(items, totalCount, paging);
};

// 회원 상태 변경 공통 처리 (정지/해제)
const changeUserStatus = async (admin, id, fromStatus, toStatus) => {
  assertAdmin(admin);

  const userId = parseId(id, "회원");
  const user = await moderationRepository.findUser(userId);

  if (!user) {
    throw createError(404, "회원을 찾을 수 없습니다.");
  }

  // 관리자 계정(본인 포함)은 정지/해제 대상이 아님
  if (user.role === USER_ROLE.ADMIN) {
    throw createError(403, "관리자 계정의 상태는 변경할 수 없습니다.");
  }

  if (user.status !== fromStatus) {
    const message =
      toStatus === USER_STATUS.SUSPENDED
        ? "이미 활동 정지된 회원입니다."
        : "활동 정지 상태인 회원이 아닙니다.";
    throw createError(409, message);
  }

  // 조회 후 다른 관리자가 먼저 바꾼 경우도 409
  const affectedRows = await moderationRepository.updateUserStatus(
    userId,
    fromStatus,
    toStatus,
  );

  if (affectedRows !== 1) {
    throw createError(409, "회원 상태가 이미 변경되었습니다.");
  }

  return { id: userId, status: toStatus };
};

// 회원 활동 정지
const suspend = (admin, id) =>
  changeUserStatus(admin, id, USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED);

// 회원 활동 정지 해제
const unsuspend = (admin, id) =>
  changeUserStatus(admin, id, USER_STATUS.SUSPENDED, USER_STATUS.ACTIVE);

// ---------------- 관리자: 신고 ----------------

// 신고 목록 (처리 상태, 대상 종류 필터, 페이지)
const listReports = async (admin, query = {}) => {
  assertAdmin(admin);

  const paging = parsePaging(query);
  const filters = {
    status: parseFilter(
      query.status,
      REPORT_STATUS,
      "신고 처리 상태 값이 올바르지 않습니다.",
    ),
    targetType: parseFilter(
      query.targetType,
      REPORT_TARGET_TYPE,
      "신고 대상 종류가 올바르지 않습니다.",
    ),
  };

  const totalCount = await moderationRepository.countReports(filters);
  const rows = await moderationRepository.findReports(
    filters,
    paging.limit,
    paging.offset,
  );

  const reports = rows.map((row) => ({
    ...row,
    targetDeleted: Number(row.targetDeleted) === 1,
    targetReportCount: Number(row.targetReportCount),
  }));

  return toPageResponse(reports, totalCount, paging);
};

// 신고 처리ㅣ 조치 완료(RESOLVED) 또는 반려(REJECTED)
// 게시물 삭제는 별도 관리자 삭제 API에서 처리
const resolveReport = async (admin, id, status) => {
  assertAdmin(admin);

  const reportId = parseId(id, "신고");

  if (status !== REPORT_STATUS.RESOLVED && status !== REPORT_STATUS.REJECTED) {
    throw createError(400, "처리 상태는 RESOLVED 또는 REJECTED만 가능합니다.");
  }

  const report = await moderationRepository.findReport(reportId);

  if (!report) {
    throw createError(404, "신고를 찾을 수 없습니다.");
  }

  if (report.status !== REPORT_STATUS.PENDING) {
    throw createError(409, "이미 처리된 신고입니다.");
  }

  const affectedRows = await moderationRepository.updateReportStatus(
    reportId,
    status,
  );

  if (affectedRows !== 1) {
    throw createError(409, "이미 처리된 신고입니다.");
  }

  return { id: reportId, status };
};

// ---------------- 관리자: 모집 글 ----------------

// 모집 글 목록 (모집 상태, 제목 검색, 페이지)
const listProjects = async (admin, query = {}) => {
  assertAdmin(admin);

  const paging = parsePaging(query);
  const filters = {
    status: parseFilter(
      query.status,
      PROJECT_STATUS,
      "모집 상태 값이 올바르지 않습니다.",
    ),
    keyword: typeof query.keyword === "string" ? query.keyword.trim() : "",
  };

  const totalCount = await moderationRepository.countProjects(filters);
  const rows = await moderationRepository.findProjects(
    filters,
    paging.limit,
    paging.offset,
  );

  const projects = rows.map((row) => ({
    ...row,
    pendingReportCount: Number(row.pendingReportCount),
  }));

  return toPageResponse(projects, totalCount, paging);
};

// 모집 글 삭제 (작성자 삭제와 같이 소프트 삭제 + 대기 요청 취소, NFR-040)
// 모집 글 Repository의 기존 함수를 같은 트렌젝션에서 사용
const removeProject = async (admin, id) => {
  assertAdmin(admin);

  const projectId = parseId(id, "모집 글");

  const tx = await pool.getConnection();

  try {
    await tx.beginTransaction();

    const project = await projectRepository.findByIdForUpdate(tx, projectId);

    if (!project) {
      throw createError(404, "모집 글을 찾을 수 없습니다.");
    }

    await projectRepository.softDelete(tx, projectId);
    await projectRepository.cancelPendingRequests(tx, projectId);

    await tx.commit();

    return { id: projectId };
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.release();
  }
};

// ---------------- 관리자: 질문·답변 ----------------

// 질문·답변 목록 종류 (ALL: 질문과 답변을 합친 전체 목록)
const QNA_TYPE = Object.freeze({
  ALL: "ALL",
  QUESTION: "QUESTION",
  ANSWER: "ANSWER",
});

// 질문 답변 목록 (type=All 기본, QUESTION, ANSWER / 제목, 내용, 작성자 검색 / 페이지)
const listQna = async (admin, query = {}) => {
  assertAdmin(admin);

  const type =
    parseFilter(
      query.type,
      QNA_TYPE,
      "목록 종류는 ALL, QUESTION, ANSWER만 가능합니다.",
    ) ?? QNA_TYPE.ALL;
  const paging = parsePaging(query);
  const filters = {
    keyword: typeof query.keyword === "string" ? query.keyword.trim() : "",
  };

  if (type === QNA_TYPE.ALL) {
    const [questionCount, answerCount] = await Promise.all([
      moderationRepository.countQuestions(filters),
      moderationRepository.countAnswers(filters),
    ]);
    const rows = await moderationRepository.findQnaAll(
      filters,
      paging.limit,
      paging.offset,
    );

    const items = rows.map((row) => ({
      ...row,
      isSolved: Number(row.isSolved) === 1,
      isAccepted: Number(row.isAccepted) === 1,
      pendingReportCount: Number(row.pendingReportCount),
    }));

    return {
      type,
      ...toPageResponse(items, questionCount + answerCount, paging),
    };
  }

  if (type === QNA_TYPE.ANSWER) {
    const totalCount = await moderationRepository.countAnswers(filters);
    const rows = await moderationRepository.findAnswers(
      filters,
      paging.limit,
      paging.offset,
    );

    const answers = rows.map((row) => ({
      ...row,
      isAccepted: Number(row.isAccepted) === 1,
      pendingReportCount: Number(row.pendingReportCount),
    }));

    return { type, ...toPageResponse(answers, totalCount, paging) };
  }

  const totalCount = await moderationRepository.countQuestions(filters);
  const rows = await moderationRepository.findQuestions(
    filters,
    paging.limit,
    paging.offset,
  );

  const questions = rows.map((row) => ({
    ...row,
    isSolved: Number(row.isSolved) === 1,
    answerCount: Number(row.answerCount),
    pendingReportCount: Number(row.pendingReportCount),
  }));

  return { type, ...toPageResponse(questions, totalCount, paging) };
};

// 질문 삭제 (소프트 삭제, 달린 답변은 목록에서 함께 제외됨)
const removeQuestion = async (admin, id) => {
  assertAdmin(admin);

  const questionId = parseId(id, "질문");

  const affectedRows =
    await moderationRepository.softDeleteQuestion(questionId);

  if (affectedRows !== 1) {
    throw createError(404, "질문을 찾을 수 없습니다.");
  }

  return { id: questionId };
};

// 답변 삭제
// 채택된 답변이면 채택 해제 + 질문 미해결 복귀를 같은 트랜잭션에서 처리
const removeAnswer = async (admin, id) => {
  assertAdmin(admin);

  const answerId = parseId(id, "답변");

  const tx = await pool.getConnection();

  try {
    await tx.beginTransaction();

    const answer = await moderationRepository.findAnswerForDeleteForUpdate(
      tx,
      answerId,
    );

    if (!answer) {
      throw createError(404, "답변을 찾을 수 없습니다.");
    }

    const wasAccepted = Number(answer.isAccepted) === 1;

    const affectedRows = await moderationRepository.softDeleteAnswer(
      tx,
      answerId,
    );

    if (affectedRows !== 1) {
      throw createError(409, "답변 상태가 변경되었습니다. 다시 확인해 주세요.");
    }
    if (wasAccepted) {
      await moderationRepository.reopenQuestion(tx, answer.questionId);
    }

    await tx.commit();

    return { id: answerId, questionReopened: wasAccepted };
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.release();
  }
};

module.exports = {
  report,
  listUsers,
  suspend,
  unsuspend,
  listReports,
  resolveReport,
  listProjects,
  removeProject,
  listQna,
  removeQuestion,
  removeAnswer,
};

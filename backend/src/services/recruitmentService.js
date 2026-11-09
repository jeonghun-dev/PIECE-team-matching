// 참여 요청, 팀 합류 업무 규칙
const pool = require("../config/db");
const recruitmentRepository = require("../repositories/recruitmentRepository");
const {
  PROJECT_STATUS,
  REQUEST_TYPE,
  REQUEST_STATUS,
  MEMBER_ROLE,
} = require("../constants");

// 공통 에러 처리 미들웨어에 전달할 오류 생성
const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// URL로 받은 모집 글 번호 검사
const parseProjectId = (id) => {
  const projectId = Number(id);

  if (!Number.isSafeInteger(projectId) || projectId < 1) {
    throw createError(400, "모집 글 번호가 올바르지 않습니다.");
  }

  return projectId;
};

// URL로 받은 참여 초대 요청 번호 검사
const parseRequestId = (id) => {
  const requestId = Number(id);

  if (!Number.isSafeInteger(requestId) || requestId < 1) {
    throw createError(400, "요청 번호가 올바르지 않습니다.");
  }

  return requestId;
};

// 한국 날짜를 YYYY-MM-DD 문자열로 반환
const getToday = () => {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

// 팀 합류 공통 처리
// 호출하는 accept 함수에서 다음 검사를 먼저 마쳐야 함:
// 1. 프로젝트 → 요청 순서로 잠금
// 2. 요청 수락 권한과 PENDING 상태 확인
// 이 함수는 같은 tx를 사용하며 commit/rollback은 호출한 함수가 담당
const joinTeam = async (tx, project, requestId, userId) => {
  if (project.status !== PROJECT_STATUS.OPEN || project.deadline < getToday()) {
    throw createError(409, "모집이 마감된 프로젝트입니다.");
  }

  const member = await recruitmentRepository.findMember(tx, project.id, userId);

  if (member) {
    throw createError(409, "이미 해당 팀에 소속되어 있습니다.");
  }

  const memberCount = await recruitmentRepository.countMembers(tx, project.id);

  const capacity = Number(project.capacity);

  if (memberCount >= capacity) {
    throw createError(409, "모집 정원이 가득 찼습니다.");
  }

  await recruitmentRepository.addMember(tx, {
    projectId: project.id,
    userId,
  });

  const updatedCount = await recruitmentRepository.updateStatus(
    tx,
    requestId,
    REQUEST_STATUS.ACCEPTED,
  );

  if (updatedCount !== 1) {
    throw createError(409, "이미 처리된 요청입니다.");
  }

  // 수락한 요청을 먼저 ACCEPTED로 변경한 뒤 나머지를 취소
  if (memberCount + 1 >= capacity) {
    const closedCount = await recruitmentRepository.closeProject(
      tx,
      project.id,
    );

    if (closedCount !== 1) {
      throw createError(409, "모집 상태가 변경되었습니다.");
    }

    await recruitmentRepository.cancelPendingRequests(tx, project.id);
  }
};

// 참여 요청 생성
// actor: 인증 미들웨어가 확인한 로그인 사용자
const apply = async (actor, id) => {
  if (!actor) {
    throw createError(401, "로그인이 필요합니다.");
  }

  const projectId = parseProjectId(id);

  const tx = await pool.getConnection();

  try {
    await tx.beginTransaction();

    // 같은 프로젝트의 요청, 생성, 수락, 수정과 순서를 맞추기 위한 잠금
    const project = await recruitmentRepository.findProjectForUpdate(
      tx,
      projectId,
    );

    if (!project) {
      throw createError(404, "모집 글을 찾을 수 없습니다.");
    }

    if (String(project.authorId) === String(actor.id)) {
      throw createError(403, "본인 모집 글에는 참여 요청을 보낼 수 없습니다.");
    }

    if (
      project.status !== PROJECT_STATUS.OPEN ||
      project.deadline < getToday()
    ) {
      throw createError(409, "모집이 마감된 프로젝트입니다.");
    }

    const member = await recruitmentRepository.findMember(
      tx,
      projectId,
      actor.id,
    );

    if (member) {
      throw createError(409, "이미 해당 팀에 소속되어 있습니다.");
    }

    const pendingRequest = await recruitmentRepository.findPendingApplication(
      tx,
      projectId,
      actor.id,
    );

    if (pendingRequest) {
      throw createError(409, "이미 대기 중인 참여 요청이 있습니다.");
    }

    const memberCount = await recruitmentRepository.countMembers(tx, projectId);

    if (memberCount >= Number(project.capacity)) {
      throw createError(409, "모집 정원이 가득 찼습니다.");
    }

    const requestId = await recruitmentRepository.saveRequest(tx, {
      projectId,
      senderId: actor.id,
      receiverId: project.authorId,
      type: REQUEST_TYPE.APPLY,
      message: null,
    });

    await tx.commit();

    return { id: requestId };
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.release();
  }
};

// 모집 글 작성자가 팀 구인 중인 사용자에게 초대 요청을 보낸다.
const invite = async (actor, id, input = {}) => {
  if (!actor) throw createError(401, "로그인이 필요합니다.");
  const projectId = parseProjectId(id);
  const userId = Number(input.userId);
  const message = input.message == null ? null : String(input.message).trim();
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw createError(400, "초대할 회원 번호가 올바르지 않습니다.");
  }
  if (message && message.length > 500) {
    throw createError(400, "초대 메시지는 500자 이하로 입력해 주세요.");
  }
  if (String(actor.id) === String(userId)) {
    throw createError(400, "본인에게 초대 요청을 보낼 수 없습니다.");
  }

  const tx = await pool.getConnection();
  try {
    await tx.beginTransaction();
    const project = await recruitmentRepository.findProjectForUpdate(tx, projectId);
    if (!project) throw createError(404, "모집 글을 찾을 수 없습니다.");
    if (String(project.authorId) !== String(actor.id)) {
      throw createError(403, "모집 글 작성자만 초대할 수 있습니다.");
    }
    if (project.status !== PROJECT_STATUS.OPEN || project.deadline < getToday()) {
      throw createError(409, "모집 중인 프로젝트에서만 초대할 수 있습니다.");
    }
    const target = await recruitmentRepository.findInviteTarget(tx, userId);
    if (!target || target.status !== "ACTIVE" || target.role !== "USER") {
      throw createError(404, "초대할 회원을 찾을 수 없습니다.");
    }
    if (!target.lookingForTeam) {
      throw createError(409, "팀 구인 중인 사용자만 초대할 수 있습니다.");
    }
    if (await recruitmentRepository.findMember(tx, projectId, userId)) {
      throw createError(409, "이미 해당 팀에 소속되어 있습니다.");
    }
    if (await recruitmentRepository.findPendingInvitation(tx, projectId, userId)) {
      throw createError(409, "이미 대기 중인 초대 요청이 있습니다.");
    }
    const memberCount = await recruitmentRepository.countMembers(tx, projectId);
    if (memberCount >= Number(project.capacity)) {
      throw createError(409, "모집 정원이 가득 찼습니다.");
    }
    const requestId = await recruitmentRepository.saveRequest(tx, {
      projectId, senderId: actor.id, receiverId: userId,
      type: REQUEST_TYPE.INVITE, message,
    });
    await tx.commit();
    return { id: requestId, projectId, userId, status: REQUEST_STATUS.PENDING };
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.release();
  }
};

// 모집 글 작성자 전용 대기 지원자 목록 조회
const listApplicants = async (actor, id) => {
  if (!actor) {
    throw createError(401, "로그인이 필요합니다.");
  }

  const projectId = parseProjectId(id);
  const project = await recruitmentRepository.findProject(projectId);

  if (!project) {
    throw createError(404, "모집 글을 찾을 수 없습니다.");
  }

  if (String(project.authorId) !== String(actor.id)) {
    throw createError(403, "작성자만 지원자 목록을 조회할 수 있습니다.");
  }

  return recruitmentRepository.findApplicants(
    projectId,
    REQUEST_STATUS.PENDING,
  );
};

// 모집 글 작성자가 참여 요청을 수락
const accept = async (actor, id) => {
  if (!actor) {
    throw createError(401, "로그인이 필요합니다.");
  }

  const requestId = parseRequestId(id);

  // 먼저 프로젝트 번호만 확인
  // 실제 권한과 상태는 잠금을 획득한 뒤 다시 검사
  const requestInfo = await recruitmentRepository.findRequest(requestId);

  if (!requestInfo) {
    throw createError(404, "요청을 찾을 수 없습니다.");
  }

  const tx = await pool.getConnection();

  try {
    await tx.beginTransaction();

    // 모든 수락 처리에서 프로젝트 → 요청 순서로 잠금
    const project = await recruitmentRepository.findProjectForUpdate(
      tx,
      requestInfo.projectId,
    );

    if (!project) {
      throw createError(404, "모집 글을 찾을 수 없습니다.");
    }

    const request = await recruitmentRepository.lockRequest(tx, requestId);

    if (!request) {
      throw createError(404, "요청을 찾을 수 없습니다.");
    }

    if (String(request.projectId) !== String(project.id)) {
      throw createError(409, "요청 정보가 변경되었습니다.");
    }

    // 현재 함수는 참여 요청 수락을 담당
    if (![REQUEST_TYPE.APPLY, REQUEST_TYPE.INVITE].includes(request.type)) {
      throw createError(400, "참여 또는 초대 요청만 처리할 수 있습니다.");
    }
    const isAuthorizedRecipient = String(request.receiverId) === String(actor.id) && (
      request.type === REQUEST_TYPE.APPLY
        ? String(project.authorId) === String(actor.id)
        : String(project.authorId) === String(request.senderId)
    );
    if (!isAuthorizedRecipient) throw createError(403, "요청을 받은 사용자만 수락할 수 있습니다.");

    if (request.status !== REQUEST_STATUS.PENDING) {
      throw createError(409, "이미 처리된 요청입니다.");
    }

    const joiningUserId = request.type === REQUEST_TYPE.INVITE
      ? request.receiverId
      : request.senderId;
    if (String(joiningUserId) === String(project.authorId)) {
      throw createError(409, "본인 모집 글의 참여 요청은 수락할 수 없습니다.");
    }

    // 참여 요청에서는 보낸 사람이 새 팀원이 됨
    await joinTeam(tx, project, requestId, joiningUserId);

    await tx.commit();

    return {
      id: requestId,
      projectId: project.id,
      status: REQUEST_STATUS.ACCEPTED,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.release();
  }
};

// 모집 글 작성자가 참여 요청을 거절
const reject = async (actor, id) => {
  if (!actor) {
    throw createError(401, "로그인이 필요합니다.");
  }

  const requestId = parseRequestId(id);
  const requestInfo = await recruitmentRepository.findRequest(requestId);

  if (!requestInfo) {
    throw createError(404, "요청을 찾을 수 없습니다.");
  }

  const tx = await pool.getConnection();

  try {
    await tx.beginTransaction();

    // 수락과 동일하게 프로젝트 → 요청 순서로 잠금
    const project = await recruitmentRepository.findProjectForUpdate(
      tx,
      requestInfo.projectId,
    );

    if (!project) {
      throw createError(404, "모집 글을 찾을 수 없습니다.");
    }

    const request = await recruitmentRepository.lockRequest(tx, requestId);

    if (!request) {
      throw createError(404, "요청을 찾을 수 없습니다.");
    }

    if (String(request.projectId) !== String(project.id)) {
      throw createError(409, "요청 정보가 변경되었습니다.");
    }

    if (![REQUEST_TYPE.APPLY, REQUEST_TYPE.INVITE].includes(request.type)) {
      throw createError(400, "참여 또는 초대 요청만 처리할 수 있습니다.");
    }
    const isAuthorizedRecipient = String(request.receiverId) === String(actor.id) && (
      request.type === REQUEST_TYPE.APPLY
        ? String(project.authorId) === String(actor.id)
        : String(project.authorId) === String(request.senderId)
    );
    if (!isAuthorizedRecipient) throw createError(403, "요청을 받은 사용자만 거절할 수 있습니다.");

    if (request.status !== REQUEST_STATUS.PENDING) {
      throw createError(409, "이미 처리된 요청입니다.");
    }

    const updatedCount = await recruitmentRepository.updateStatus(
      tx,
      requestId,
      REQUEST_STATUS.REJECTED,
    );

    if (updatedCount !== 1) {
      throw createError(409, "이미 처리된 요청입니다.");
    }

    await tx.commit();

    return {
      id: requestId,
      projectId: project.id,
      status: REQUEST_STATUS.REJECTED,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.release();
  }
};

// 보낸 사용자는 대기 중인 참여/초대 요청을 취소할 수 있다.
const cancel = async (actor, id) => {
  if (!actor) throw createError(401, "로그인이 필요합니다.");
  const requestId = parseRequestId(id);
  const requestInfo = await recruitmentRepository.findRequest(requestId);
  if (!requestInfo) throw createError(404, "요청을 찾을 수 없습니다.");
  const tx = await pool.getConnection();
  try {
    await tx.beginTransaction();
    const project = await recruitmentRepository.findProjectForUpdate(tx, requestInfo.projectId);
    if (!project) throw createError(404, "모집 글을 찾을 수 없습니다.");
    const request = await recruitmentRepository.lockRequest(tx, requestId);
    if (!request) throw createError(404, "요청을 찾을 수 없습니다.");
    if (String(request.projectId) !== String(project.id)) throw createError(409, "요청 정보가 변경되었습니다.");
    if (String(request.senderId) !== String(actor.id)) throw createError(403, "요청을 보낸 사용자만 취소할 수 있습니다.");
    if (request.status !== REQUEST_STATUS.PENDING) throw createError(409, "이미 처리된 요청입니다.");
    if (![REQUEST_TYPE.APPLY, REQUEST_TYPE.INVITE].includes(request.type)) {
      throw createError(400, "참여 또는 초대 요청만 취소할 수 있습니다.");
    }
    const updatedCount = await recruitmentRepository.updateStatus(tx, requestId, REQUEST_STATUS.CANCELED);
    if (updatedCount !== 1) throw createError(409, "이미 처리된 요청입니다.");
    await tx.commit();
    return { id: requestId, projectId: project.id, status: REQUEST_STATUS.CANCELED };
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.release();
  }
};

// 로그인한 회원의 현재 팀원 목록 조회
const listMembers = async (actor, id) => {
  if (!actor) {
    throw createError(401, "로그인이 필요합니다.");
  }

  const projectId = parseProjectId(id);
  const project = await recruitmentRepository.findProject(projectId);

  if (!project) {
    throw createError(404, "모집 글을 찾을 수 없습니다.");
  }

  return recruitmentRepository.findMembers(projectId);
};

// 모집 글 작성자가 일반 팀원을 제외
const removeMember = async (actor, id, targetUserId) => {
  if (!actor) {
    throw createError(401, "로그인이 필요합니다.");
  }

  const projectId = parseProjectId(id);
  const userId = Number(targetUserId);

  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw createError(400, "회원 번호가 올바르지 않습니다.");
  }

  const tx = await pool.getConnection();

  try {
    await tx.beginTransaction();

    const project = await recruitmentRepository.findProjectForUpdate(
      tx,
      projectId,
    );

    if (!project) {
      throw createError(404, "모집 글을 찾을 수 없습니다.");
    }

    if (String(project.authorId) !== String(actor.id)) {
      throw createError(403, "작성자만 팀원을 제외할 수 있습니다.");
    }

    if (
      project.status !== PROJECT_STATUS.OPEN ||
      project.deadline < getToday()
    ) {
      throw createError(
        409,
        "모집 중인 프로젝트에서만 팀원을 제외할 수 있습니다.",
      );
    }

    if (String(project.authorId) === String(userId)) {
      throw createError(409, "팀장 본인은 제외할 수 없습니다.");
    }

    const member = await recruitmentRepository.findMember(
      tx,
      projectId,
      userId,
    );

    if (!member) {
      throw createError(404, "해당 프로젝트의 팀원을 찾을 수 없습니다.");
    }

    if (member.role !== MEMBER_ROLE.MEMBER) {
      throw createError(409, "일반 팀원만 제외할 수 있습니다.");
    }

    const deletedCount = await recruitmentRepository.removeMember(
      tx,
      projectId,
      userId,
    );

    if (deletedCount !== 1) {
      throw createError(409, "팀원 정보가 변경되었습니다.");
    }

    await tx.commit();

    return { projectId, userId };
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.release();
  }
};

module.exports = {
  apply,
  invite,
  listApplicants,
  accept,
  reject,
  cancel,
  listMembers,
  removeMember,
};

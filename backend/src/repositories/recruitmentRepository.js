// 참여 요청, 팀 합류 관련 DB 접근
// tx: Service에서 transaction을 시작한 DB 연결

const pool = require("../config/db");
const {
  REQUEST_TYPE,
  REQUEST_STATUS,
  MEMBER_ROLE,
  PROJECT_STATUS,
} = require("../constants");

// 모집 글을 잠그고 참여 가능 여부 검사에 필요한 정보 조회
const findProjectForUpdate = async (tx, projectId) => {
  const [rows] = await tx.query(
    `SELECT
            id,
            author_id AS authorId,
            capacity,
            status,
            DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline
        FROM projects
        WHERE id = ?
            AND deleted_at IS NULL
        FOR UPDATE`,
    [projectId],
  );

  return rows[0] ?? null;
};

// 해당 프로젝트에 이미 소속된 회원인지 조회
// 프로젝트 행을 먼저 잠근 뒤 같은 tx로 호출
const findMember = async (tx, projectId, userId) => {
  const [rows] = await tx.query(
    `SELECT id, project_id AS projectId, user_id AS userId, role
        FROM project_members
        WHERE project_id = ?
            AND user_id = ?
        FOR UPDATE`,
    [projectId, userId],
  );

  return rows[0] ?? null;
};

// 같은 프로젝트에 해당 회원이 보낸 대기 중 참여 요청 조회
// 프로젝트 행을 먼저 잠근 뒤 같은 tx로 호출
const findPendingApplication = async (tx, projectId, userId) => {
  const [rows] = await tx.query(
    `SELECT id
     FROM project_requests
     WHERE project_id = ?
       AND sender_id = ?
       AND type = ?
       AND status = ?
     LIMIT 1
     FOR UPDATE`,
    [projectId, userId, REQUEST_TYPE.APPLY, REQUEST_STATUS.PENDING],
  );

  return rows[0] ?? null;
};

// 같은 프로젝트와 대상 사용자 사이에 대기 중인 초대가 있는지 조회
const findPendingInvitation = async (tx, projectId, userId) => {
  const [rows] = await tx.query(
    `SELECT id FROM project_requests
     WHERE project_id = ? AND receiver_id = ? AND type = ? AND status = ?
     LIMIT 1 FOR UPDATE`,
    [projectId, userId, REQUEST_TYPE.INVITE, REQUEST_STATUS.PENDING],
  );
  return rows[0] ?? null;
};

const findInviteTarget = async (tx, userId) => {
  const [rows] = await tx.query(
    `SELECT id, status, role, looking_for_team AS lookingForTeam
     FROM users WHERE id = ? FOR UPDATE`,
    [userId],
  );
  return rows[0] ?? null;
};

// 새 요청을 대기 상태로 저장하고 생성된 요청 번호 반환
const saveRequest = async (tx, request) => {
  const [result] = await tx.query(
    `INSERT INTO project_requests
      (project_id, sender_id, receiver_id, type, status, message)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      request.projectId,
      request.senderId,
      request.receiverId,
      request.type,
      REQUEST_STATUS.PENDING,
      request.message ?? null,
    ],
  );

  return result.insertId;
};

// 현재 팀원 수 조회 (작성자 포함)
// 프로젝트 행을 먼저 잠근 뒤 같은 tx로 호출
const countMembers = async (tx, projectId) => {
  const [rows] = await tx.query(
    `SELECT COUNT(*) AS memberCount
    FROM project_members
    WHERE project_id = ?`,
    [projectId],
  );

  return Number(rows[0].memberCount);
};

// 조회 권환 확인용 모집 글 조회 (잠금 없음)
const findProject = async (projectId) => {
  const [rows] = await pool.query(
    `SELECT
      id,
      author_id AS authorId
    FROM projects
    WHERE id = ?
      AND deleted_at IS NULL`,
    [projectId],
  );

  return rows[0] ?? null;
};

// 지정한 상태의 참여 지원자 조회
// 지원자 목록에서는 Service가 REQUEST_STATUS.PENDING을 전달
const findApplicants = async (projectId, status) => {
  const [rows] = await pool.query(
    `SELECT
       r.id AS requestId,
       r.project_id AS projectId,
       r.sender_id AS userId,
       r.status,
       r.created_at AS createdAt,
       u.nickname,
       u.level,
       u.total_score AS totalScore,
       u.intro,
       u.certificates,
       u.award_count AS awardCount,
       u.project_count AS projectCount,
       u.collaboration_mode AS collaborationMode,
       u.active_times AS activeTimes
     FROM project_requests r
     JOIN users u ON u.id = r.sender_id
     JOIN projects p ON p.id = r.project_id
     WHERE r.project_id = ?
       AND r.type = ?
       AND r.status = ?
       AND p.deleted_at IS NULL
     ORDER BY r.created_at DESC, r.id DESC`,
    [projectId, REQUEST_TYPE.APPLY, status],
  );

  return rows;
};

// 요청이 속한 프로젝트 확인용 조회 (잠금 없음)
// 수락 여부 판단에는 이후 잠금 조회한 최신 요청 정보를 사용
const findRequest = async (requestId) => {
  const [rows] = await pool.query(
    `SELECT
       id,
       project_id AS projectId
     FROM project_requests
     WHERE id = ?`,
    [requestId],
  );

  return rows[0] ?? null;
};

// 요청 행을 잠그고 최신 정보 조회
// 프로젝트 행을 먼저 잠근 뒤 같은 tx로 호출
const lockRequest = async (tx, requestId) => {
  const [rows] = await tx.query(
    `SELECT
       id,
       project_id AS projectId,
       sender_id AS senderId,
       receiver_id AS receiverId,
       type,
       status
     FROM project_requests
     WHERE id = ?
     FOR UPDATE`,
    [requestId],
  );

  return rows[0] ?? null;
};

// 대기 중인 요청의 상태와 처리 시각 변경
// 프로젝트와 요청을 먼저 잠근 뒤 같은 tx로 호출
const updateStatus = async (tx, requestId, status) => {
  const [result] = await tx.query(
    `UPDATE project_requests
     SET status = ?,
         processed_at = CURRENT_TIMESTAMP,
         notification_read_at = COALESCE(notification_read_at, CURRENT_TIMESTAMP)
     WHERE id = ?
       AND status = ?`,
    [status, requestId, REQUEST_STATUS.PENDING],
  );

  return result.affectedRows;
};

// 수락한 회원을 일반 팀원으로 등록
// 프로젝트 잠금, 정원·중복 소속 검사 후 같은 tx로 호출
const addMember = async (tx, member) => {
  const [result] = await tx.query(
    `INSERT INTO project_members
       (project_id, user_id, role)
     VALUES (?, ?, ?)`,
    [member.projectId, member.userId, MEMBER_ROLE.MEMBER],
  );

  return result.insertId;
};

// 정원 충족 시 모집 종료
// 프로젝트 행을 먼저 잠근 뒤 같은 tx로 호출
const closeProject = async (tx, projectId) => {
  const [result] = await tx.query(
    `UPDATE projects
     SET status = ?
     WHERE id = ?
       AND status = ?
       AND deleted_at IS NULL`,
    [PROJECT_STATUS.CLOSED, projectId, PROJECT_STATUS.OPEN],
  );

  return result.affectedRows;
};

// 현재 소속된 팀원 조회
const findMembers = async (projectId) => {
  const [rows] = await pool.query(
    `SELECT
       m.id AS membershipId,
       m.project_id AS projectId,
       m.user_id AS userId,
       m.role,
       m.joined_at AS joinedAt,
       u.nickname,
       u.level,
       u.intro
     FROM project_members m
     JOIN users u ON u.id = m.user_id
     JOIN projects p ON p.id = m.project_id
     WHERE m.project_id = ?
       AND p.deleted_at IS NULL
     ORDER BY
       CASE WHEN m.role = ? THEN 0 ELSE 1 END,
       m.joined_at ASC,
       m.id ASC`,
    [projectId, MEMBER_ROLE.LEADER],
  );

  return rows;
};

const findOwnedOpenProjects = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.title, p.capacity, p.target_level AS targetLevel,
       DATE_FORMAT(p.deadline, '%Y-%m-%d') AS deadline,
       (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id) AS memberCount
     FROM projects p
     WHERE p.author_id = ? AND p.status = ? AND p.deleted_at IS NULL
       AND p.deadline >= DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR)
     ORDER BY p.created_at DESC, p.id DESC`,
    [userId, PROJECT_STATUS.OPEN],
  );
  return rows;
};

// 일반 팀원의 소속 삭제
// Service에서 프로젝트 잠금과 권한 검사를 완료한 뒤 호출
const removeMember = async (tx, projectId, userId) => {
  const [result] = await tx.query(
    `DELETE FROM project_members
     WHERE project_id = ?
       AND user_id = ?
       AND role = ?`,
    [projectId, userId, MEMBER_ROLE.MEMBER],
  );

  return result.affectedRows;
};

module.exports = {
  findProjectForUpdate,
  findMember,
  findPendingApplication,
  findPendingInvitation,
  findInviteTarget,
  saveRequest,
  countMembers,
  findProject,
  findApplicants,
  findRequest,
  lockRequest,
  updateStatus,
  addMember,
  closeProject,
  findMembers,
  findOwnedOpenProjects,
  removeMember,
};

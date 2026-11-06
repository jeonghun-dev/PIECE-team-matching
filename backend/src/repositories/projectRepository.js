
// 모집 글 저장 + 작성자를 팀원(LEADER)으로 등록
// tx: Service에서 연 트랜잭션 연결
const { REQUEST_STATUS } = require("../constants");

const save = async (tx, project) => {
  const [result] = await tx.query(
    `INSERT INTO projects
       (author_id, title, content, meeting_method, target_level,
        capacity, progress_mode, active_times, deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      project.authorId,
      project.title,
      project.content,
      project.meetingMethod,
      project.targetLevel,
      project.capacity,
      project.progressMode,
      project.activeTimes,   
      project.deadline,
    ]
  );

  const projectId = result.insertId; // 방금 저장된 모집 글 번호

  await tx.query(
    `INSERT INTO project_members (project_id, user_id, role)
     VALUES (?, ?, 'LEADER')`,
    [projectId, project.authorId]
  );

  return projectId;
};

// 수정·삭제 전에 모집 글 한 건 조회 (트랜잭션 끝날 때까지 잠금)
const findByIdForUpdate = async (tx, id) => {
  const [rows] = await tx.query(
    `SELECT id, author_id AS authorId, status
       FROM projects
      WHERE id = ? AND deleted_at IS NULL
      FOR UPDATE`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

// 현재 팀원 수 (작성자 포함)
const countMembers = async (tx, projectId) => {
  const [rows] = await tx.query(
    `SELECT COUNT(*) AS count
       FROM project_members
      WHERE project_id = ?`,
    [projectId]
  );

  return Number(rows[0].count);
};

// 모집 글 내용 수정
const update = async (tx, id, project) => {
  const [result] = await tx.query(
    `UPDATE projects
        SET title = ?, content = ?, meeting_method = ?, target_level = ?,
            capacity = ?, progress_mode = ?, active_times = ?, deadline = ?
      WHERE id = ? AND deleted_at IS NULL`,
    [
      project.title,
      project.content,
      project.meetingMethod,
      project.targetLevel,
      project.capacity,
      project.progressMode,
      project.activeTimes,
      project.deadline,
      id,
    ]
  );

  return result.affectedRows;
};

// 모집 글 소프트 삭제 (삭제 시각만 기록)
const softDelete = async (tx, id) => {
  const [result] = await tx.query(
    `UPDATE projects
        SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );

  return result.affectedRows;
};

// 이 모집 글에 걸린 대기 중 요청을 모두 취소
const cancelPendingRequests = async (tx, projectId) => {
  const [result] = await tx.query(
    `UPDATE project_requests
        SET status = ?, processed_at = CURRENT_TIMESTAMP
      WHERE project_id = ? AND status = ?`,
    [REQUEST_STATUS.CANCELED, projectId, REQUEST_STATUS.PENDING]
  );

  return result.affectedRows;
};

module.exports = {
  save,
  findByIdForUpdate,
  countMembers,
  update,
  softDelete,
  cancelPendingRequests,
};
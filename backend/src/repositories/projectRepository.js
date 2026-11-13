
// 모집 글 저장 + 작성자를 팀원(LEADER)으로 등록
// tx: Service에서 연 트랜잭션 연결
const { REQUEST_STATUS, PROJECT_STATUS, REQUEST_TYPE } = require("../constants");
//목록조회에 사용할 db 연결 풀
const pool = require("../config/db");

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

// 정원 충족 시 모집 완료로 변경
const close = async (tx, id) => {
  const [result] = await tx.query(
    `UPDATE projects
        SET status = ?
      WHERE id = ? AND deleted_at IS NULL`,
    [PROJECT_STATUS.CLOSED, id]
  );

  return result.affectedRows;
};

// 마감일이 지난 모집중 글 번호 조회 (트랜잭션 끝날 때까지 잠금)
const findExpiredForUpdate = async (tx, today) => {
  const [rows] = await tx.query(
    `SELECT id
       FROM projects
      WHERE status = ?
        AND deadline < ?
        AND deleted_at IS NULL
      FOR UPDATE`,
    [PROJECT_STATUS.OPEN, today]
  );

  return rows.map((row) => row.id);
};

// 목록과 전체 개수에 같은 검색·필터 조건을 적용한다.
const buildSearchCondition = (keyword, level, status) => {
    const conditions = ["deleted_at IS NULL"];
    const params = [];

    if (keyword !== "") {
        const pattern = `%${keyword.replace(/[!%_]/g, "!$&")}%`;

        conditions.push(
            "(title LIKE ? ESCAPE '!' OR content LIKE ? ESCAPE '!')"
        );
        params.push(pattern, pattern);
    }

    if (level !== undefined) {
        conditions.push("target_level = ?");
        params.push(level);
    }

    if (status !== undefined) {
        conditions.push("status = ?");
        params.push(status);
    }

    return {
        condition: conditions.join(" AND "),
        params
    };
};

// 검색 조건에 맞는 삭제되지 않은 모집 글의 전체 개수를 조회한다.
const count = async (keyword = "", level, status) => {
    const { condition, params } = buildSearchCondition(
        keyword,
        level,
        status
    );
    const [rows] = await pool.execute(
        `
      SELECT COUNT(*) AS total
      FROM projects
      WHERE ${condition}
    `,
        params
    );

    return Number(rows[0].total);
};

// 삭제되지 않은 모집 글을 최신순으로 한 페이지 조회한다.
const findPage = async (
    limit,
    offset,
    keyword = "",
    level,
    status,
    sort = "latest"
) => {
    const { condition, params } = buildSearchCondition(
        keyword,
        level,
        status
    );
    const sortOrders ={
        latest: "created_at DESC, id DESC" ,
        views : "view_count DESC, created_at DESC, id DESC",
        questions: "questionCount DESC, created_at DESC, id DESC "
    };

    const orderBy = sortOrders[sort];

    const [rows] = await pool.execute(
        `
      SELECT
        id,
        author_id AS authorId,
        title,
        LEFT(content, 200) AS contentPreview,
        meeting_method AS meetingMethod,
        target_level AS targetLevel,
        capacity,
          (
          SELECT COUNT(*)
          FROM project_members pm
          WHERE pm.project_id = projects.id
          ) AS memberCount,  
        progress_mode AS progressMode,
        active_times AS activeTimes,
        status,
        view_count AS viewCount,
        deadline,
        created_at AS createdAt,
        (
            SELECT COUNT(*)
            FROM questions q
            WHERE q.project_id = projects.id
              AND q.deleted_at IS NULL
        ) AS questionCount
      FROM projects
      WHERE ${condition}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `,
        [...params, limit, offset]
    );

    return rows;
};

// 삭제되지 않은 모집 글 한 건을 조회한다.
const findById = async (id) => {
    const [rows] = await pool.execute(
        `
      SELECT
        id,
        author_id AS authorId,
        title,
        content,
        meeting_method AS meetingMethod,
        target_level AS targetLevel,
        capacity,
        (
            SELECT COUNT(*)
            FROM project_members pm
            WHERE pm.project_id = projects.id
        ) AS memberCount,
        (
            SELECT COUNT(*)
            FROM project_requests pr
            WHERE pr.project_id = projects.id
              AND pr.type = ?
              AND pr.status = ?
        ) AS pendingCount,
        progress_mode AS progressMode,
        active_times AS activeTimes,
        deadline,
        DATEDIFF(
                deadline,
                DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR)
        ) AS dDay,
        status,
        view_count AS viewCount,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM projects
      WHERE id = ?
        AND deleted_at IS NULL
    `,
        [REQUEST_TYPE.APPLY, REQUEST_STATUS.PENDING, id]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
};

// 삭제되지 않은 모집 글의 조회수를 1 증가시킨다.
const increaseViewCount = async (id) => {
    const [result] = await pool.execute(
        `
      UPDATE projects
      SET view_count = view_count + 1
      WHERE id = ?
        AND deleted_at IS NULL
    `,
        [id]
    );

    return result.affectedRows;
};
// 해당 사용자가 프로젝트에 소속되어 있는지 확인한다.
const existsMember = async (projectId, userId) => {
    const [rows] = await pool.execute(
        `
      SELECT id
      FROM project_members
      WHERE project_id = ?
        AND user_id = ?
      LIMIT 1
    `,
        [projectId, userId]
    );

    return rows.length > 0;
};

// 해당 사용자가 보낸 대기 중인 참여 요청이 있는지 확인한다.
const existsPendingApplication = async (projectId, userId) => {
    const [rows] = await pool.execute(
        `
      SELECT id
      FROM project_requests
      WHERE project_id = ?
        AND sender_id = ?
        AND type = ?
        AND status = ?
      LIMIT 1
    `,
        [
            projectId,
            userId,
            REQUEST_TYPE.APPLY,
            REQUEST_STATUS.PENDING
        ]
    );

    return rows.length > 0;
};




module.exports ={
    existsPendingApplication,
    findById,
    existsMember,
    increaseViewCount,
    findPage,
    count,
    save,
    findByIdForUpdate,
    countMembers,
    update,
    softDelete,
    cancelPendingRequests,
    close,
    findExpiredForUpdate
};

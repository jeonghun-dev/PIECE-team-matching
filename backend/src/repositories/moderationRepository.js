// 신고, 관리자 기능 관련 DB 접근
const pool = require("../config/db");
const {
  REPORT_TARGET_TYPE,
  REPORT_STATUS,
  USER_ROLE,
} = require("../constants");

// 신고 대상 종류별 테이블 이름
// 사용자 입력을 SQL에 직접 넣지 않고, 정해진 값만 사용
const TARGET_TABLES = Object.freeze({
  [REPORT_TARGET_TYPE.PROJECT]: "projects",
  [REPORT_TARGET_TYPE.QUESTION]: "questions",
  [REPORT_TARGET_TYPE.ANSWER]: "answers",
});

// 신고 대상 글 조회 (삭제된 글 제외)
// 본인 글 신고 차단을 위해 작성자 번호 함께 반환
const findTarget = async (targetType, targetId) => {
  const table = TARGET_TABLES[targetType];

  const [rows] = await pool.query(
    `SELECT
            id,
            author_id AS authorId
            FROM ${table}
            WHERE id = ?
                AND deleted_at IS NULL`,
    [targetId],
  );

  return rows[0] ?? null;
};

// 신고 저장
// status는 DB 기본값 PENDING 사용
const saveReport = async (report) => {
  const [result] = await pool.query(
    `INSERT INTO reports
            (reporter_id, target_type, target_id, reason, detail)
            VALUES (?, ?, ?, ?, ?)`,
    [
      report.reporterId,
      report.targetType,
      report.targetId,
      report.reason,
      report.detail,
    ],
  );

  return result.insertId;
};

// ---------------- 관리자: 회원 ----------------

// 회원 목록 검색 조건 만들기
const buildUserCondition = (filters) => {
  const conditions = ["1 = 1"];
  const params = [];

  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (filters.keyword) {
    conditions.push("(email LIKE ? OR nickname LIKE ?)");
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  return { where: conditions.join(" AND "), params };
};

// 회원 목록 전체 개수
const countUsers = async (filters) => {
  const { where, params } = buildUserCondition(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
            FROM users
            WHERE ${where}`,
    params,
  );

  return Number(rows[0].totalCount);
};

// 회원 목록 조회 (비밀번호 해쉬 제외)
const findUsers = async (filters, limit, offset) => {
  const { where, params } = buildUserCondition(filters);

  const [rows] = await pool.query(
    `SELECT
            id,
            email,
            nickname,
            role,
            status,
            level,
            created_at AS createdAt
        FROM users
        WHERE ${where}
        ORDER BY id DESC
        LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return rows;
};

// 회원 한명 조회 (정지/헤제 전 확인용)
const findUser = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, role, status
            FROM users
            WHERE id = ?`,
    [userId],
  );

  return rows[0] ?? null;
};

// 회원 상태 변경
// 일반 회원이면서 현재 상태가 fromStatus인 경우에만 변경
const updateUserStatus = async (userId, fromStatus, toStatus) => {
  const [result] = await pool.query(
    `UPDATE users
        SET status = ?
        WHERE id = ?
            AND role = ?
            AND status = ?`,
    [toStatus, userId, USER_ROLE.USER, fromStatus],
  );

  return result.affectedRows;
};

// ---------------- 관리자: 신고 ----------------

// 신고 목록 검색 조건 만들기
const buildReportCondition = (filters) => {
  const conditions = ["1 = 1"];
  const params = [];

  if (filters.status) {
    conditions.push("r.status = ?");
    params.push(filters.status);
  }

  if (filters.targetType) {
    conditions.push("r.target_type = ?");
    params.push(filters.targetType);
  }

  return { where: conditions.join(" AND "), params };
};

// 신고 목록 전체 개수
const countReports = async (filters) => {
  const { where, params } = buildReportCondition(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
            FROM reports r
            WHERE ${where}`,
    params,
  );

  return Number(rows[0].totalCount);
};

// 신고 목록 조회
// 대상 글은 FK가 없으므로 종류별로 LEFT JOIN
// 대상 글이 삭제돼도 신고 기록은 보여주고 targetDeleted로 표시
const findReports = async (filters, limit, offset) => {
  const { where, params } = buildReportCondition(filters);

  const [rows] = await pool.query(
    `SELECT
            r.id,
            r.target_type AS targetType,
            r.target_id AS targetId,
            r.reason,
            r.detail,
            r.status,
            r.created_at AS createdAt,
            r.reporter_id AS reporterId,
            reporter.nickname AS reporterNickname,
            CASE r.target_type
                WHEN 'PROJECT' THEN p.title
                WHEN 'QUESTION' THEN q.title
                WHEN 'ANSWER' THEN LEFT(a.content, 100)
            END AS targetPreview,
            COALESCE(p.author_id, q.author_id, a.author_id) AS targetAuthorId,
            author.nickname AS targetAuthorNickname,
            a.question_id AS answerQuestionId,
            COALESCE(p.deleted_at, q.deleted_at, a.deleted_at) IS NOT NULL
                AS targetDeleted,
            (
                SELECT COUNT(*)
                FROM reports same
                WHERE same.target_type = r.target_type
                    AND same.target_id = r.target_id
                ) AS targetReportCount
            FROM reports r
            JOIN users reporter
                ON reporter.id = r.reporter_id
            LEFT JOIN projects p
                ON r.target_type = 'PROJECT' AND p.id = r.target_id
            LEFT JOIN questions q
                ON r.target_type = 'QUESTION' AND q.id = r.target_id
            LEFT JOIN answers a
                ON r.target_type = 'ANSWER' AND a.id = r.target_id
            LEFT JOIN users author
                ON author.id = COALESCE(p.author_id, q.author_id, a.author_id)
            WHERE ${where}
            ORDER BY r.created_at DESC, r.id DESC
            LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return rows;
};

// 신고 한 건 조회
const findReport = async (reportId) => {
  const [rows] = await pool.query(
    `SELECT id, status
        FROM reports
        WHERE id = ?`,
    [reportId],
  );

  return rows[0] ?? null;
};

// 신고 처리 상태 변경 (대기 중인 신고만)
const updateReportStatus = async (reportId, status) => {
  const [result] = await pool.query(
    `UPDATE reports
        SET status = ?
        WHERE id = ?
            AND status = ?`,
    [status, reportId, REPORT_STATUS.PENDING],
  );

  return result.affectedRows;
};

// ---------------- 관리자: 모집 글 ----------------'
const buildProjectCondition = (filters) => {
  const conditions = ["p.deleted_at IS NULL"];
  const params = [];

  if (filters.status) {
    conditions.push("p.status = ?");
    params.push(filters.status);
  }

  if (filters.keyword) {
    conditions.push("p.title LIKE ?");
    params.push(`%${filters.keyword}%`);
  }

  return { where: conditions.join(" AND "), params };
};

// 모집 글 목록 전체 개수
const countProjects = async (filters) => {
  const { where, params } = buildProjectCondition(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
        FROM projects p
        WHERE ${where}`,
    params,
  );

  return Number(rows[0].totalCount);
};

// 모집 글 목록 조회 (대기 중인 신고 수 포함)
const findProjects = async (filters, limit, offset) => {
  const { where, params } = buildProjectCondition(filters);

  const [rows] = await pool.query(
    `SELECT
            p.id,
            p.title,
            p.status,
            p.capacity,
            DATE_FORMAT(p.deadline, '%Y-%m-%d') AS deadline,
            p.created_at AS createdAt,
            p.author_id AS authorId,
            u.nickname AS authorNickname,
            (
                SELECT COUNT(*)
                FROM reports r
                WHERE r.target_type = 'PROJECT'
                    AND r.target_id = p.id
                    AND r.status = 'PENDING'
                ) AS pendingReportCount
            FROM projects p
            JOIN users u
                ON u.id = p.author_id
            WHERE ${where}
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return rows;
};

// ---------------- 관리자: 질문·답변 ----------------

// 질문 목록 검색 조건 만들기 (삭제된 질문 제외)
const buildQuestionCondition = (filters) => {
  const conditions = ["q.deleted_at IS NULL"];
  const params = [];

  if (filters.keyword) {
    conditions.push("(q.title LIKE ? OR q.content LIKE ?)");
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  return { where: conditions.join(" AND "), params };
};

// 질문 목록 전체 개수
const countQuestions = async (filters) => {
  const { where, params } = buildQuestionCondition(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
            FROM questions q
            WHERE ${where}`,
    params,
  );

  return Number(rows[0].totalCount);
};

// 질문 목록 조회 (답변 수, 대기 중인 신고 수 포함)
const findQuestions = async (filters, limit, offset) => {
  const { where, params } = buildQuestionCondition(filters);

  const [rows] = await pool.query(
    `SELECT
            q.id,
            q.title,
            q.project_id AS projectId,
            q.is_solved AS isSolved,
            q.created_at AS createdAt,
            q.author_id AS authorId,
            u.nickname AS authorNickname,
            (
                SELECT COUNT(*)
                FROM answers a
                WHERE a.question_id = q.id
                    AND a.deleted_at IS NULL
            ) AS answerCount,
            (
                SELECT COUNT(*)
                FROM reports r
                WHERE r.target_type = 'QUESTION'
                    AND r.target_id = q.id
                    AND r.status = 'PENDING'
            ) AS pendingReportCount
        FROM questions q
        JOIN users u
            ON u.id = q.author_id
        WHERE ${where}
        ORDER BY q.id DESC
        LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return rows;
};

// 답변 목록 검색 조건 만들기
// 삭제된 답변과 삭제된 질문에 달린 답변 제위 (NFR-043)
const buildAnswerCondition = (filters) => {
  const conditions = ["a.deleted_at IS NULL", "q.deleted_at IS NULL"];
  const params = [];

  if (filters.keyword) {
    conditions.push("a.content LIKE ?");
    params.push(`%${filters.keyword}%`);
  }

  return { where: conditions.join(" AND "), params };
};

// 답변 목록 전체 개수
const countAnswers = async (filters) => {
  const { where, params } = buildAnswerCondition(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
            FROM answers a
            join questions q
                ON q.id = a.question_id
            WHERE ${where}`,
    params,
  );

  return Number(rows[0].totalCount);
};

// 답변 목록 조회 (질문 제목, 대기 중인 신고 수 포함)
const findAnswers = async (filters, limit, offset) => {
  const { where, params } = buildAnswerCondition(filters);

  const [rows] = await pool.query(
    `SELECT
            a.id,
            a.question_id AS questionId,
            q.title AS questionTitle,
            LEFT(a.content, 100) AS contentPreview,
            a.is_accepted AS isAccepted,
            a.created_at AS createdAt,
            a.author_id AS authorId,
            u.nickname AS authorNickname,
            (
                SELECT COUNT(*)
                FROM reports r
                WHERE r.target_type = 'ANSWER'
                    AND r.target_id = a.id
                    AND r.status = 'PENDING'
            ) AS pendingReportCount
        FROM answers a
        JOIN questions q
            ON q.id = a.question_id
        JOIN users u
            ON u.id = a.author_id
        WHERE ${where}
        ORDER BY a.id DESC
        LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return rows;
};

// 질문 소프트 삭제 (이미 삭제된 질문은 변경 없음)
const softDeleteQuestion = async (questionId) => {
  const [result] = await pool.query(
    `UPDATE questions
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE id = ?
                AND deleted_at IS NULL`,
    [questionId],
  );

  return result.affectedRows;
};

// 삭제 전 답변 조회 (삭제된 답변, 삭제된 질문의 답변 제외)
const findAnswerForDelete = async (answerId) => {
  const [rows] = await pool.query(
    `SELECT
            a.id,
            a.is_accepted AS isAccepted
        FROM answers a
        JOIN questions q
            ON q.id = a.question_id
        WHERE a.id = ?
            AND a.deleted_at IS NULL
            AND q.deleted_at IS NULL`,
    [answerId],
  );

  return rows[0] ?? null;
};

// 답변 솦므트 삭제 (채택된 답변은 삭제하지 않음, NFR-039)
const softDeleteAnswer = async (answerId) => {
  const [result] = await pool.query(
    `UPDATE answers
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE id = ?
                AND deleted_at IS NULL
                AND is_accepted = 0`,
    [answerId],
  );

  return result.affectedRows;
};

module.exports = {
  findTarget,
  saveReport,
  countUsers,
  findUsers,
  findUser,
  updateUserStatus,
  countReports,
  findReports,
  findReport,
  updateReportStatus,
  countProjects,
  findProjects,
  countQuestions,
  findQuestions,
  countAnswers,
  findAnswers,
  softDeleteQuestion,
  findAnswerForDelete,
  softDeleteAnswer,
};

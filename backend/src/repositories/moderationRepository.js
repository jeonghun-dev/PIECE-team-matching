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
    conditions.push("u.status = ?");
    params.push(filters.status);
  }

  if (filters.keyword) {
    conditions.push("(u.email LIKE ? OR u.nickname LIKE ?)");
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  return { where: conditions.join(" AND "), params };
};

// 회원 목록 전체 개수
const countUsers = async (filters) => {
  const { where, params } = buildUserCondition(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
            FROM users u
            WHERE ${where}`,
    params,
  );

  return Number(rows[0].totalCount);
};

// 회원 목록 조회 (비밀번호 해쉬 제외)
// reportCount: 이 회원이 쓴 모집 글, 질문, 답변이 받은 신고 수 (처리 상태 무관)
const findUsers = async (filters, limit, offset) => {
  const { where, params } = buildUserCondition(filters);

  const [rows] = await pool.query(
    `SELECT
            u.id,
            u.email,
            u.nickname,
            u.role,
            u.status,
            u.level,
            u.total_score AS score,
            u.created_at AS createdAt,
            (
              SELECT COUNT(*)
              FROM reports r
              LEFT JOIN projects tp
                ON r.target_type = 'PROJECT' AND tp.id = r.target_id
              LEFT JOIN questions tq
                ON r.target_type = 'QUESTION' AND tq.id = r.target_id
              LEFT JOIN answers ta
                ON r.target_type = 'ANSWER' AND ta.id = r.target_id
              WHERE COALESCE(tp.author_id, tq.author_id, ta.author_id) = u.id
            ) AS reportCount
        FROM users u
        WHERE ${where}
        ORDER BY u.id DESC
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

// 신고 목록 공통 FROM 절
// 대상 글은 FK가 없으므로 종류별로 LEFT JOIN, 대상 작성자도 함께 연결
const REPORT_TARGET_FROM = `
  FROM reports r
  LEFT JOIN projects p
    ON r.target_type = 'PROJECT' AND p.id = r.target_id
  LEFT JOIN questions q
    ON r.target_type = 'QUESTION' AND q.id = r.target_id
  LEFT JOIN answers a
    ON r.target_type = 'ANSWER' AND a.id = r.target_id
  LEFT JOIN users author
    ON author.id = COALESCE(p.author_id, q.author_id, a.author_id)`;

// 신고 목록 검색 조건 만들기 (대상 글 기준으로 묶은 뒤 처리 생태로 거름))
// where: 묶기 전 조건, having: 묶은 뒤 조건
const buildReportCondition = (filters) => {
  const conditions = ["1 = 1"];
  const params = [];

  if (filters.targetType) {
    conditions.push("r.target_type = ?");
    params.push(filters.targetType);
  }

  if (filters.keyword) {
    conditions.push(
      "(p.title LIKE ? OR q.title LIKE ? OR a.content LIKE ? OR author.nickname LIKE ?)",
    );
    params.push(
      `%${filters.keyword}%`,
      `%${filters.keyword}%`,
      `%${filters.keyword}%`,
      `%${filters.keyword}%`,
    );
  }

  // 처리 대기: 대기 신고가 1건 이상 / 처리 완료: 대기 신고가 없음
  let having = "";

  if (filters.status === "PENDING") {
    having = "HAVING SUM(r.status = 'PENDING') > 0";
  } else if (filters.status === "DONE") {
    having = "HAVING SUM(r.status = 'PENDING') = 0";
  }

  return { where: conditions.join(" AND "), having, params };
};

// 신고 대상 수 (대상 글 기준으로 묶은 개수)
const countReports = async (filters) => {
  const { where, having, params } = buildReportCondition(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
      FROM (
        SELECT r.target_type, r.target_id
        ${REPORT_TARGET_FROM}
        WHERE ${where}
        GROUP BY r.target_type, r.target_id
        ${having}
      ) grouped`,
    params,
  );

  return Number(rows[0].totalCount);
};

// 신고 목록 조회 (대상 글 1개당 한 줄)
// 대상 글이 삭제돼도 신고 기록은 보여주고 targetDeleted로 표시
const findReports = async (filters, limit, offset) => {
  const { where, having, params } = buildReportCondition(filters);

  const [rows] = await pool.query(
    `SELECT
            r.target_type AS targetType,
            r.target_id AS targetId,
            COUNT(*) AS reportCount,
            SUM(r.status = 'PENDING') AS pendingCount,
            SUM(r.status = 'RESOLVED') AS resolvedCount,
            GROUP_CONCAT(DISTINCT r.reason ORDER BY r.reason) AS reasons,
            MAX(r.created_at) AS lastReportedAt,
            MAX(
                CASE r.target_type
                    WHEN 'PROJECT' THEN p.title
                    WHEN 'QUESTION' THEN q.title
                    WHEN 'ANSWER' THEN LEFT(a.content, 100)
                END
            ) AS targetPreview,
            MAX(COALESCE(p.author_id, q.author_id, a.author_id)) AS targetAuthorId,
            MAX(author.nickname) AS targetAuthorNickname,
            MAX(author.status) AS targetAuthorStatus,
            MAX(a.question_id) AS answerQuestionId,
            MAX(COALESCE(p.deleted_at, q.deleted_at, a.deleted_at) IS NOT NULL)
                AS targetDeleted
        ${REPORT_TARGET_FROM}
        WHERE ${where}
        GROUP BY r.target_type, r.target_id
        ${having}
        ORDER BY lastReportedAt DESC, targetType, targetId DESC
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

// ---------------- 관리자: 모집 글 ----------------

// 모집 글 목록 검색 조건 만들기 (삭제된 글 제외, 제목/작성자 검색)
const buildProjectCondition = (filters) => {
  const conditions = ["p.deleted_at IS NULL"];
  const params = [];

  if (filters.status) {
    conditions.push("p.status = ?");
    params.push(filters.status);
  }

  if (filters.keyword) {
    conditions.push("(p.title LIKE ? OR u.nickname LIKE ?)");
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  return { where: conditions.join(" AND "), params };
};

// 모집 글 목록 전체 개수
const countProjects = async (filters) => {
  const { where, params } = buildProjectCondition(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
        FROM projects p
        JOIN users u
          ON u.id = p.author_id
        WHERE ${where}`,
    params,
  );

  return Number(rows[0].totalCount);
};

// 모집 글 목록 조회 (대상 레벨, 대기 중인 신고 수 포함)
const findProjects = async (filters, limit, offset) => {
  const { where, params } = buildProjectCondition(filters);

  const [rows] = await pool.query(
    `SELECT
            p.id,
            p.title,
            p.status,
            p.target_level AS targetLevel,
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

// 질문 목록 검색 조건 만들기 (삭제된 질문, 삭제된 모집 글의 질문 제외)
const buildQuestionCondition = (filters) => {
  // 모집 글에 달린 질문이면 모집 글도 삭제되지 않아야 함 (NFR-043)
  const conditions = [
    "q.deleted_at IS NULL",
    "(q.project_id IS NULL OR p.deleted_at IS NULL)",
  ];
  const params = [];

  if (filters.keyword) {
    conditions.push(
      "(q.title LIKE ? OR q.content LIKE ? OR u.nickname LIKE ?)",
    );
    params.push(
      `%${filters.keyword}%`,
      `%${filters.keyword}%`,
      `%${filters.keyword}%`,
    );
  }

  return { where: conditions.join(" AND "), params };
};

// 질문 목록 전체 개수
const countQuestions = async (filters) => {
  const { where, params } = buildQuestionCondition(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
            FROM questions q
            JOIN users u
              ON u.id = q.author_id
            LEFT JOIN projects p
                ON p.id = q.project_id
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
        LEFT JOIN projects p
            ON p.id = q.project_id
        WHERE ${where}
        ORDER BY q.id DESC
        LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return rows;
};

// 답변 목록 검색 조건 만들기
// 삭제된 질문, 삭제된 모집 글에 달린 질문의 답변도 제외 (NFR-043)
const buildAnswerCondition = (filters) => {
  const conditions = [
    "a.deleted_at IS NULL",
    "q.deleted_at IS NULL",
    "(q.project_id IS NULL OR p.deleted_at IS NULL)",
  ];
  const params = [];

  if (filters.keyword) {
    conditions.push("(a.content LIKE ? OR u.nickname LIKE ?)");
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  return { where: conditions.join(" AND "), params };
};

// 답변 목록 전체 개수
const countAnswers = async (filters) => {
  const { where, params } = buildAnswerCondition(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
            FROM answers a
            JOIN questions q
                ON q.id = a.question_id
            LEFT JOIN projects p
                ON p.id = q.project_id
            JOIN users u
                ON u.id = a.author_id
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
        LEFT JOIN projects p
            ON p.id = q.project_id
        JOIN users u
            ON u.id = a.author_id
        WHERE ${where}
        ORDER BY a.id DESC
        LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return rows;
};

// 질문/답변 전체 목록 (질문과 답변을 합쳐 최신순)
// 검색 조건은 질문/답변 목록과 같은 함수를 그대로 사용
const findQnaAll = async (filters, limit, offset) => {
  const question = buildQuestionCondition(filters);
  const answer = buildAnswerCondition(filters);

  const [rows] = await pool.query(
    `SELECT *
      FROM (
        SELECT
          'QUESTION' AS type,
          q.id,
          q.id AS questionId,
          q.title AS title,
          q.author_id AS authorId,
          u.nickname AS authorNickname,
          q.created_at AS createdAt,
          q.is_solved AS isSolved,
          0 AS isAccepted,
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
        LEFT JOIN projects p
          ON p.id = q.project_id
        WHERE ${question.where}
        
        UNION ALL
        
        SELECT
          'ANSWER' AS type,
          a.id,
          a.question_id AS questionId,
          LEFT(a.content, 100) AS title,
          a.author_id AS authorId,
          u.nickname AS authorNickname,
          a.created_at AS createdAt,
          0 AS isSolved,
          a.is_accepted AS isAccepted,
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
        LEFT JOIN projects p
          ON p.id = q.project_id
        JOIN users u
          ON u.id = a.author_id
        WHERE ${answer.where}
      ) qna
       ORDER BY qna.createdAt DESC, qna.type, qna.id DESC
       LIMIT ? OFFSET ?`,
    [...question.params, ...answer.params, limit, offset],
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

// 삭제 전 답변 잠금 조회 (트랜잭션 안에서 사용)
// 질문 행도 함께 잠가서 삭제 중에 다른 채택이 끼어들지 않게 함
const findAnswerForDeleteForUpdate = async (tx, answerId) => {
  const [rows] = await tx.query(
    `SELECT
            a.id,
            a.question_id AS questionId,
            a.is_accepted AS isAccepted
        FROM answers a
        JOIN questions q
            ON q.id = a.question_id
        LEFT JOIN projects p
            ON p.id = q.project_id
        WHERE a.id = ?
            AND a.deleted_at IS NULL
            AND q.deleted_at IS NULL
            AND (q.project_id IS NULL OR p.deleted_at IS NULL)
        FOR UPDATE`,
    [answerId],
  );

  return rows[0] ?? null;
};

// 답변 소프트 삭제 + 채택 해제 (관리자는 채택된 답변도 삭제 가능)
const softDeleteAnswer = async (tx, answerId) => {
  const [result] = await tx.query(
    `UPDATE answers
            SET deleted_at = CURRENT_TIMESTAMP,
                is_accepted = 0
            WHERE id = ?
                AND deleted_at IS NULL`,
    [answerId],
  );

  return result.affectedRows;
};

// 채택 답변이 삭제된 질문을 미해결로 돌림 (다시 채택 가능)
const reopenQuestion = async (tx, questionId) => {
  const [result] = await tx.query(
    `UPDATE questions
            SET is_solved = 0
            WHERE id = ?
                AND is_solved = 1`,
    [questionId],
  );

  return result.affectedRows;
};

// 신고 대상 1개의 대기 중인 신고를 한꺼번에 처리 (조치 완료 또는 반려)
const updateReportStatusByTarget = async (targetType, targetId, status) => {
  const [result] = await pool.query(
    `UPDATE reports
      SET status = ?
      WHERE target_type = ?
        AND target_id = ?
        AND status = ?`,
    [status, targetType, targetId, REPORT_STATUS.PENDING],
  );

  return result.affectedRows;
};

// 내가 신고한 대상 번호 목록 (화면의 신고 버튼 "신고됨" 표시용)
const findMyReportedTargetIds = async (reporterId, targetType, targetIds) => {
  const [rows] = await pool.query(
    `SELECT target_id AS targetId
      FROM reports
      WHERE reporter_id = ?
        AND target_type = ?
        AND target_id IN (?)`,
    [reporterId, targetType, targetIds],
  );

  return rows.map((row) => Number(row.targetId));
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
  updateReportStatusByTarget,
  findMyReportedTargetIds,
  countProjects,
  findProjects,
  countQuestions,
  findQuestions,
  countAnswers,
  findAnswers,
  findQnaAll,
  softDeleteQuestion,
  findAnswerForDeleteForUpdate,
  softDeleteAnswer,
  reopenQuestion,
};

// 마이페이지 조회 SQL (김성진) - REQ-USR-004
// 목록마다 [현재 페이지 목록, 전체 개수]를 함께 조회한다.
const pool = require("../config/db");
const { REQUEST_TYPE, REQUEST_STATUS } = require("../constants");

// 1. 참여 중인 팀 (내가 팀장·팀원으로 소속된 모집 글)
const findTeams = async (userId, paging) => {
  const [rows] = await pool.query(
    `SELECT p.id AS projectId,
                p.title,
                m.role,
                p.status,
                p.target_level AS targetLevel,
                p.capacity,
                (SELECT COUNT(*) FROM project_members pm
                  WHERE pm.project_id = p.id) AS memberCount,
                p.progress_mode AS progressMode,
                p.active_times AS activeTimes,
                (SELECT GROUP_CONCAT(u.nickname ORDER BY pm.role = 'LEADER' DESC, pm.joined_at SEPARATOR ',')
                   FROM project_members pm
                   JOIN users u ON u.id = pm.user_id
                  WHERE pm.project_id = p.id) AS memberNicknames,
                DATE_FORMAT(p.deadline, '%Y-%m-%d') AS deadline,
                m.joined_at AS joinedAt
           FROM project_members m
           JOIN projects p ON p.id = m.project_id
          WHERE m.user_id = ?
            AND p.deleted_at IS NULL
          ORDER BY m.joined_at DESC, m.id DESC
          LIMIT ? OFFSET ?`,
    [userId, paging.limit, paging.offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
           FROM project_members m
           JOIN projects p ON p.id = m.project_id
          WHERE m.user_id = ?
            AND p.deleted_at IS NULL`,
    [userId]
  );

  return { items: rows, totalCount: Number(countRows[0].totalCount) };
};

// 2. 내가 작성한 모집 글 (관리용: 팀원 수, 대기 중인 참여 요청 수 포함)
const findProjects = async (userId, paging) => {
  const [rows] = await pool.query(
    `SELECT p.id,
                p.title,
                p.status,
                p.target_level AS targetLevel,
                p.capacity,
                (SELECT COUNT(*) FROM project_members pm
                  WHERE pm.project_id = p.id) AS memberCount,
                (SELECT COUNT(*) FROM project_requests r
                  WHERE r.project_id = p.id
                    AND r.type = ?
                    AND r.status = ?) AS pendingCount,
                DATE_FORMAT(p.deadline, '%Y-%m-%d') AS deadline,
                DATEDIFF(p.deadline, DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR)) AS dDay,
                p.view_count AS viewCount,
                p.created_at AS createdAt
           FROM projects p
          WHERE p.author_id = ?
            AND p.deleted_at IS NULL
          ORDER BY p.created_at DESC, p.id DESC
          LIMIT ? OFFSET ?`,
    [REQUEST_TYPE.APPLY, REQUEST_STATUS.PENDING, userId, paging.limit, paging.offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
           FROM projects p
          WHERE p.author_id = ?
            AND p.deleted_at IS NULL`,
    [userId]
  );

  return { items: rows, totalCount: Number(countRows[0].totalCount) };
};

// 3. 최근 작성한 질문 (질문 게시판 + 모집 글 질문, 삭제된 모집 글의 질문은 제외)
const findQuestions = async (userId, paging) => {
  const [rows] = await pool.query(
    `SELECT q.id,
                q.project_id AS projectId,
                q.title,
                q.is_solved AS isSolved,
                q.view_count AS viewCount,
                (SELECT COUNT(*) FROM answers a
                  WHERE a.question_id = q.id
                    AND a.deleted_at IS NULL) AS answerCount,
                q.created_at AS createdAt
           FROM questions q
           LEFT JOIN projects p ON p.id = q.project_id
          WHERE q.author_id = ?
            AND q.deleted_at IS NULL
            AND p.deleted_at IS NULL
          ORDER BY q.created_at DESC, q.id DESC
          LIMIT ? OFFSET ?`,
    [userId, paging.limit, paging.offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
           FROM questions q
           LEFT JOIN projects p ON p.id = q.project_id
          WHERE q.author_id = ?
            AND q.deleted_at IS NULL
            AND p.deleted_at IS NULL`,
    [userId]
  );

  return { items: rows, totalCount: Number(countRows[0].totalCount) };
};

// 4. 최근 작성한 답변 (질문이 삭제된 답변은 제외)
const findAnswers = async (userId, paging) => {
  const [rows] = await pool.query(
    `SELECT a.id,
                a.question_id AS questionId,
                q.project_id AS projectId,
                q.title AS questionTitle,
                LEFT(a.content, 200) AS contentPreview,
                a.is_accepted AS isAccepted,
                a.created_at AS createdAt
           FROM answers a
           JOIN questions q ON q.id = a.question_id
           LEFT JOIN projects p ON p.id = q.project_id
          WHERE a.author_id = ?
            AND a.deleted_at IS NULL
            AND q.deleted_at IS NULL
            AND p.deleted_at IS NULL
          ORDER BY a.created_at DESC, a.id DESC
          LIMIT ? OFFSET ?`,
    [userId, paging.limit, paging.offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS totalCount
           FROM answers a
           JOIN questions q ON q.id = a.question_id
           LEFT JOIN projects p ON p.id = q.project_id
          WHERE a.author_id = ?
            AND a.deleted_at IS NULL
            AND q.deleted_at IS NULL
            AND p.deleted_at IS NULL`,
    [userId]
  );

  return { items: rows, totalCount: Number(countRows[0].totalCount) };
};

module.exports = { findTeams, findProjects, findQuestions, findAnswers };
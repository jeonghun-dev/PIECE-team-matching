const pool = require("../config/db");

// 목록과 전체 개수 조회에서 공통으로 사용하는 검색 조건이다.
const searchCondition = `q.project_id IS NULL AND q.deleted_at IS NULL
  AND (q.title LIKE ? ESCAPE '!' OR q.content LIKE ? ESCAPE '!')`;

function getSearchPattern(keyword) {
  // %, _를 와일드카드가 아닌 문자 그대로 찾기 위한 처리이다.
  return `%${keyword.replace(/[!%_]/g, "!$&")}%`;
}

async function findPage(keyword, size, offset) {
  const pattern = getSearchPattern(keyword);
  const [rows] = await pool.execute(
    `SELECT q.id, q.author_id AS authorId, u.nickname AS authorNickname,
      q.title, LEFT(q.content, 200) AS contentPreview,
      q.view_count AS viewCount, q.is_solved AS isSolved,
      q.created_at AS createdAt,
      (SELECT COUNT(*) FROM answers a
        WHERE a.question_id = q.id AND a.deleted_at IS NULL) AS answerCount
     FROM questions q JOIN users u ON u.id = q.author_id
     WHERE ${searchCondition}
     ORDER BY q.created_at DESC, q.id DESC
     LIMIT ? OFFSET ?`,
    [pattern, pattern, size, offset]
  );
  return rows.map((row) => ({
    ...row, isSolved: Boolean(row.isSolved), answerCount: Number(row.answerCount)
  }));
}

async function count(keyword) {
  const pattern = getSearchPattern(keyword);
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM questions q
     JOIN users u ON u.id = q.author_id WHERE ${searchCondition}`,
    [pattern, pattern]
  );
  return Number(rows[0].total);
}

module.exports = { findPage, count };

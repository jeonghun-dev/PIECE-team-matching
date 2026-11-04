const pool = require("../config/db");

// 목록 조회와 개수 조회에서 공통으로 사용하는 검색 조건이다.
const WHERE = `q.project_id IS NULL AND q.deleted_at IS NULL
  AND (q.title LIKE ? OR q.content LIKE ?)`;

function searchValues(keyword) {
  // %, _를 와일드카드가 아닌 문자 그대로 검색하기 위한 처리이다.
  // !는 LIKE에서 사용하는 이스케이프 문자이다.
  const escaped = keyword.replace(/[!%_]/g, "!$&");
  return [`%${escaped}%`, `%${escaped}%`];
}
const SEARCH_WHERE = WHERE.replaceAll("LIKE ?", "LIKE ? ESCAPE '!'");

// 연결 풀을 외부에서 받아 실제 DB 없이도 SQL과 전달값을 검증할 수 있는 구조이다.
function createQuestionRepository(db) {
  return {
    async findPage(keyword = "", limit = 10, offset = 0) {
      const [rows] = await db.execute(
        `SELECT q.id, q.author_id AS authorId, u.nickname AS authorNickname,
          q.title, LEFT(q.content, 200) AS contentPreview,
          q.view_count AS viewCount, q.is_solved AS isSolved,
          q.created_at AS createdAt,
          (SELECT COUNT(*) FROM answers a
            WHERE a.question_id = q.id AND a.deleted_at IS NULL) AS answerCount
         FROM questions q JOIN users u ON u.id = q.author_id
         WHERE ${SEARCH_WHERE}
         ORDER BY q.created_at DESC, q.id DESC
         LIMIT ? OFFSET ?`,
        [...searchValues(keyword), limit, offset]
      );
      return rows.map(row => ({ ...row, isSolved: Boolean(row.isSolved),
        answerCount: Number(row.answerCount) }));
    },
    async count(keyword = "") {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total FROM questions q
         JOIN users u ON u.id = q.author_id WHERE ${SEARCH_WHERE}`,
        searchValues(keyword)
      );
      return Number(rows[0].total);
    }
  };
}

module.exports = { ...createQuestionRepository(pool), createQuestionRepository };

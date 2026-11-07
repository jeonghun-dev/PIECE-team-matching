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

// 일반 질문을 저장하고 생성된 질문 번호를 반환하는 함수이다.
async function save(question) {
  const [result] = await pool.execute(
      `
      INSERT INTO questions (
        author_id,
        project_id,
        title,
        content
      )
      VALUES (?, NULL, ?, ?)
    `,
      [
        question.authorId,
        question.title,
        question.content
      ]
  );

  return result.insertId;
}

//모집 글 질문을 저장하는 함수

async function saveForProject(question) {
  const [result] = await pool.execute(
   `  
      INSERT INTO questions (
          author_id,
          project_id,
          title,
          content
      )
      VALUES(?,?,?,?)
      `,
  [
      question.authorId,
      question.projectId,
      question.title,
      question.content

  ]

  );
  return result.insertId;
}

// 삭제되지 않은 모집 글이 존재하는지 확인한다.
async function existsProject(projectId){
  const[rows] = await pool.execute(
      `
      SELECT id
      FROM projects
      WHERE id = ?
        AND deleted_at IS NULL
      
      `,
      [projectId]
  );
  return rows.length >0;
}





// 삭제되지 않은 일반 질문 한 건을 조회하는 함수이다.
async function findById(id) {
  const [rows] = await pool.execute(
      `
      SELECT
        q.id,
        q.author_id AS authorId,
        u.nickname AS authorNickname,
        q.title,
        q.content,
        q.view_count AS viewCount,
        q.is_solved AS isSolved,
        q.created_at AS createdAt,
        q.updated_at AS updatedAt
      FROM questions q
      JOIN users u ON u.id = q.author_id
      WHERE q.id = ?
        AND q.project_id IS NULL
        AND q.deleted_at IS NULL
    `,
      [
        id
      ]
  );

  if (rows.length === 0) {
    return null;
  }

  return {
    ...rows[0],
    isSolved: Boolean(rows[0].isSolved)
  };
}

// 삭제되지 않은 일반 질문의 조회수를 1 증가시키는 함수이다.
async function increaseViewCount(id) {
  const [result] = await pool.execute(
      `
      UPDATE questions
      SET view_count = view_count + 1
      WHERE id = ?
        AND project_id IS NULL
        AND deleted_at IS NULL
    `,
      [
        id
      ]
  );

  return result.affectedRows;
}

// 작성자가 본인의 일반 질문 제목과 내용을 수정하는 함수이다.
async function update(id, input) {
  const [result] = await pool.execute(
      `
      UPDATE questions
      SET
        title = ?,
        content = ?
      WHERE id = ?
        AND author_id = ?
        AND project_id IS NULL
        AND deleted_at IS NULL
    `,
      [
        input.title,
        input.content,
        id,
        input.authorId
      ]
  );

  return result.affectedRows;
}




// 작성자 본인의 일반 질문에 삭제 시각을 기록하는 함수이다.
async function softDelete(id, authorId) {
  const [result] = await pool.execute(
    `
      UPDATE questions
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND author_id = ?
        AND project_id IS NULL
        AND deleted_at IS NULL
    `,
    [
      id,
      authorId
    ]
  );

  return result.affectedRows;
}

module.exports = {
  existsProject,
  saveForProject,
  findPage,
  count,
  save,
  findById,
  increaseViewCount,
  update,
  softDelete
};

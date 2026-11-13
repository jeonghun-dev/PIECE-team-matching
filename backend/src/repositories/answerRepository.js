const pool = require("../config/db");

async function findByQuestionId(questionId) {
  const [rows] = await pool.execute(
    `
        SELECT
            a.id,
            a.question_id AS questionId,
            a.author_id AS authorId,
            a.content,
            a.created_at AS createdAt,
            a.updated_at AS updatedAt,
            u.nickname AS authorNickname,
            u.level AS authorLevel,
            u.total_score AS authorScore,
            a.is_accepted AS isAccepted
        FROM answers a
        JOIN users u ON u.id = a.author_id
        JOIN questions q on q.id = a.question_id
        LEFT JOIN projects p ON p.id = q.project_id
        WHERE a.question_id = ?
            AND a.deleted_at IS NULL
            AND q.deleted_at IS NULL
            AND (
                q.project_id IS NULL
                OR (p.id IS NOT NULL AND p.deleted_at IS NULL)
            )
        ORDER BY a.created_at ASC, a.id ASC
        `,
    [questionId],
  );

  return rows;
}

async function findQuestionById(questionId) {
  const [rows] = await pool.execute(
    `
        SELECT
            q.id,
            q.author_id,
            q.is_solved
        FROM questions q
        LEFT JOIN projects p ON p.id = q.project_id
        WHERE q.id = ?
            AND q.deleted_at IS NULL
            AND (
                q.project_id IS NULL
                OR (p.id IS NOT NULL AND p.deleted_at IS NULL)
            )
        `,
    [questionId],
  );
  return rows[0] ?? null;
}

async function save(answer) {
  const [result] = await pool.execute(
    `
        INSERT INTO answers (question_id, author_id, content)
        VALUES (?, ?, ?)
        `,
    [answer.questionId, answer.authorId, answer.content],
  );
  return result.insertId;
}

async function findById(answerId) {
  const [rows] = await pool.execute(
    `
        SELECT
            a.id,
            a.question_id,
            a.author_id,
            a.content
        FROM answers a
        JOIN questions q ON q.id = a.question_id
        LEFT JOIN projects p ON p.id = q.project_id
        WHERE a.id = ?
            AND a.deleted_at IS NULL
            AND q.deleted_at IS NULL
            AND (
                q.project_id IS NULL
                OR (p.id IS NOT NULL AND p.deleted_at IS NULL)
            )
        `,
    [answerId],
  );

  return rows[0] ?? null;
}

async function update(answerId, input) {
  const [result] = await pool.execute(
    `
        UPDATE answers a
        JOIN questions q ON q.ID = a.question_id
        LEFT JOIN projects p ON p.id = q.project_id
        SET a.content = ?
        WHERE a.id = ?
            AND a.author_id = ?
            AND a.deleted_at IS NULL
            AND q.deleted_at IS NULL
            AND (
                q.project_id IS NULL
                OR (p.id IS NOT NULL AND p.deleted_at IS NULL)
            )
        `,
    [input.content, answerId, input.authorId],
  );

  return result.affectedRows;
}

async function withTransaction(work) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await work(connection);

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findByIdForUpdate(connection, answerId) {
  const [rows] = await connection.execute(
    `
        SELECT
            a.id,
            a.question_id,
            a.author_id,
            a.is_accepted
        FROM answers a
        JOIN questions q ON q.id = a.question_id
        LEFT JOIN projects p ON p.id = q.project_id
        WHERE a.id = ?
            AND a.deleted_at IS NULL
            AND q.deleted_at IS NULL
            AND (
              q.project_id IS NULL
              OR (p.id IS NOT NULL AND p.deleted_at IS NULL)
            )
        FOR UPDATE
        `,
    [answerId],
  );

  return rows[0] ?? null;
}

async function softDelete(connection, answerId, authorId) {
  const [result] = await connection.execute(
    `
        UPDATE answers a
        JOIN questions q ON q.id = a.question_id
        LEFT JOIN projects p ON p.id = q.project_id
        SET a.deleted_at = CURRENT_TIMESTAMP
        WHERE a.id =?
            AND a.author_id = ?
            AND a.deleted_at IS NULL
            AND q.deleted_at IS NULL
            AND (
                q.project_id IS NULL
                OR (p.id IS NOT NULL AND p.deleted_at IS NULL)
            )
            And a.is_accepted = 0
        `,
    [answerId, authorId],
  );

  return result.affectedRows;
}

async function acceptIfOpen(answerId, authorId) {
  const [result] = await pool.execute(
    `
        UPDATE questions q
        JOIN answers a ON a.question_id = q.id
        LEFT JOIN projects p ON p.id = q.project_id
        SET q.is_solved = 1,
            a.is_accepted = 1
        WHERE a.id = ?
            AND q.author_id = ?
            AND a.author_id <> q.author_id
            AND q.is_solved = 0
            AND q.deleted_at IS NULL
            AND a.deleted_at IS NULL
            AND (
                q.project_id IS NULL
                OR (p.id IS NOT NULL AND p.deleted_at IS NULL)
            )
        `,
    [answerId, authorId],
  );

  return result.affectedRows;
}

module.exports = {
  findByQuestionId,
  findQuestionById,
  findById,
  save,
  update,
  withTransaction,
  findByIdForUpdate,
  softDelete,
  acceptIfOpen,
};

// 신고, 관리자 기능 관련 DB 접근
const pool = require("../config/db");
const { REPORT_TARGET_TYPE } = require("../constants");

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

module.exports = {
  findTarget,
  saveReport,
};

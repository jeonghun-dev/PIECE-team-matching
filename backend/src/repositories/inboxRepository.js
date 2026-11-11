// 요청함 조회에 필요한 SQL
const pool = require("../config/db");
const { REQUEST_STATUS } = require("../constants");

const buildRequestCondition = (userId, direction, {
  type,
  status,
  unreadOnly = false,
  includeCanceled = false,
}) => {
  const ownerColumn = direction === "received" ? "r.receiver_id" : "r.sender_id";
  const conditions = [`${ownerColumn} = ?`, "p.deleted_at IS NULL"];
  const values = [userId];

  // 취소한 요청은 상대방의 받은 요청 목록에서 제외한다.
  // 조회와 totalCount가 같은 조건 빌더를 사용해 페이지 수가 일치한다.
  if (direction === "received" && !includeCanceled) {
    conditions.push("r.status <> ?");
    values.push(REQUEST_STATUS.CANCELED);
  }

  if (type) {
    conditions.push("r.type = ?");
    values.push(type);
  }
  if (status) {
    conditions.push("r.status = ?");
    values.push(status);
  }
  if (unreadOnly) conditions.push("r.notification_read_at IS NULL");

  return { conditions, values };
};

const findByDirection = async (userId, direction, {
  type,
  status,
  limit,
  offset,
  unreadOnly,
  includeCanceled,
}) => {
  const ownerColumn = direction === "received" ? "r.receiver_id" : "r.sender_id";
  const otherColumn = direction === "received" ? "r.sender_id" : "r.receiver_id";
  const { conditions, values } = buildRequestCondition(userId, direction, {
    type,
    status,
    unreadOnly,
    includeCanceled,
  });

  const [rows] = await pool.execute(
    `SELECT r.id, r.project_id AS projectId, p.title AS projectTitle,
       r.sender_id AS senderId, r.receiver_id AS receiverId,
       other.nickname AS otherNickname, other.level AS otherLevel,
       other.total_score AS otherTotalScore, r.type, r.status, r.message,
       r.created_at AS createdAt, r.processed_at AS processedAt
     FROM project_requests r
     JOIN projects p ON p.id = r.project_id
     JOIN users other ON other.id = ${otherColumn}
     WHERE ${conditions.join(" AND ")}
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );

  return rows;
};

const findReceived = (userId, options) => findByDirection(userId, "received", options);
const findSent = (userId, options) => findByDirection(userId, "sent", options);

const countByDirection = async (userId, direction, { type, status }) => {
  const { conditions, values } = buildRequestCondition(userId, direction, { type, status });

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM project_requests r
     JOIN projects p ON p.id = r.project_id
     WHERE ${conditions.join(" AND ")}`,
    values,
  );

  return Number(rows[0].total);
};

const countReceived = (userId, filters) => countByDirection(userId, "received", filters);
const countSent = (userId, filters) => countByDirection(userId, "sent", filters);

const countPendingReceived = (userId) =>
  countReceived(userId, { status: REQUEST_STATUS.PENDING });

const findNotifications = (userId, options) => findByDirection(userId, "received", {
  ...options,
  unreadOnly: true,
  includeCanceled: true,
});

const countUnreadNotifications = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM project_requests r
     JOIN projects p ON p.id = r.project_id
     WHERE r.receiver_id = ?
       AND r.notification_read_at IS NULL
       AND p.deleted_at IS NULL`,
    [userId],
  );
  return Number(rows[0].total);
};

const markNotificationRead = async (userId, requestId) => {
  const [rows] = await pool.execute(
    `SELECT id FROM project_requests WHERE id = ? AND receiver_id = ? LIMIT 1`,
    [requestId, userId],
  );
  if (!rows.length) return false;

  await pool.execute(
    `UPDATE project_requests
     SET notification_read_at = COALESCE(notification_read_at, CURRENT_TIMESTAMP)
     WHERE id = ? AND receiver_id = ?`,
    [requestId, userId],
  );
  return true;
};

module.exports = {
  findSent,
  findReceived,
  findNotifications,
  countUnreadNotifications,
  markNotificationRead,
  countSent,
  countReceived,
  countPendingReceived,
};

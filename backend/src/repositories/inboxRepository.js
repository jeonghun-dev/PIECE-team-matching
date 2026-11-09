// 요청함 조회에 필요한 SQL
const pool = require("../config/db");
const { REQUEST_STATUS } = require("../constants");

const findByDirection = async (userId, direction, { type, status, limit, offset }) => {
  const ownerColumn = direction === "received" ? "r.receiver_id" : "r.sender_id";
  const otherColumn = direction === "received" ? "r.sender_id" : "r.receiver_id";
  const conditions = [`${ownerColumn} = ?`, "p.deleted_at IS NULL"];
  const values = [userId];

  if (type) {
    conditions.push("r.type = ?");
    values.push(type);
  }
  if (status) {
    conditions.push("r.status = ?");
    values.push(status);
  }

  const [rows] = await pool.execute(
    `SELECT r.id, r.project_id AS projectId, p.title AS projectTitle,
       r.sender_id AS senderId, r.receiver_id AS receiverId,
       other.nickname AS otherNickname, r.type, r.status, r.message,
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
  const ownerColumn = direction === "received" ? "receiver_id" : "sender_id";
  const conditions = [`r.${ownerColumn} = ?`, "p.deleted_at IS NULL"];
  const values = [userId];

  if (type) {
    conditions.push("r.type = ?");
    values.push(type);
  }
  if (status) {
    conditions.push("r.status = ?");
    values.push(status);
  }

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

module.exports = {
  findSent,
  findReceived,
  countSent,
  countReceived,
  countPendingReceived,
};

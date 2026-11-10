const inboxRepository = require("../repositories/inboxRepository");
const recruitmentRepository = require("../repositories/recruitmentRepository");
const { getPagination, toPageResponse } = require("../utils/pagination");
const { REQUEST_STATUS, REQUEST_TYPE } = require("../constants");

const createError = (status, message) => Object.assign(new Error(message), { status });

const validateActor = (actor) => {
  if (!actor) throw createError(401, "로그인이 필요합니다.");
};

const validateFilters = (query) => {
  const type = query.type || undefined;
  const status = query.status || undefined;
  if (type && !Object.values(REQUEST_TYPE).includes(type)) {
    throw createError(400, "요청 종류가 올바르지 않습니다.");
  }
  if (status && !Object.values(REQUEST_STATUS).includes(status)) {
    throw createError(400, "요청 상태가 올바르지 않습니다.");
  }
  return { type, status };
};

const list = async (actor, query = {}) => {
  validateActor(actor);
  const direction = query.tab || "received";
  if (!["received", "sent"].includes(direction)) {
    throw createError(400, "요청 탭은 received 또는 sent여야 합니다.");
  }
  const filters = validateFilters(query);
  // The request inbox only shows requests that are still actionable.
  filters.status = REQUEST_STATUS.PENDING;
  const paging = getPagination(query);
  const findPage = direction === "received"
    ? inboxRepository.findReceived
    : inboxRepository.findSent;
  const countPage = direction === "received"
    ? inboxRepository.countReceived
    : inboxRepository.countSent;
  const [items, totalCount] = await Promise.all([
    findPage(actor.id, { ...filters, limit: paging.limit, offset: paging.offset }),
    countPage(actor.id, filters),
  ]);
  return toPageResponse(items, totalCount, paging);
};

const pendingCount = async (actor) => {
  validateActor(actor);
  return { count: await inboxRepository.countPendingReceived(actor.id) };
};

const notifications = async (actor) => {
  validateActor(actor);
  return inboxRepository.findNotifications(actor.id, { limit: 20, offset: 0 });
};

const unreadNotificationCount = async (actor) => {
  validateActor(actor);
  return { count: await inboxRepository.countUnreadNotifications(actor.id) };
};

const markNotificationRead = async (actor, rawRequestId) => {
  validateActor(actor);
  const requestId = Number(rawRequestId);
  if (!Number.isSafeInteger(requestId) || requestId < 1) {
    throw createError(400, "유효하지 않은 요청 번호입니다.");
  }
  const marked = await inboxRepository.markNotificationRead(actor.id, requestId);
  if (!marked) throw createError(404, "요청 알림을 찾을 수 없습니다.");
  return { read: true };
};

const ownedOpenProjects = async (actor) => {
  validateActor(actor);
  return recruitmentRepository.findOwnedOpenProjects(actor.id);
};

module.exports = {
  list,
  pendingCount,
  notifications,
  unreadNotificationCount,
  markNotificationRead,
  ownedOpenProjects,
};

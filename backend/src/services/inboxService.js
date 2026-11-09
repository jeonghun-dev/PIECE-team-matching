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
  const paging = getPagination(query);
  const [items, totalCount] = await Promise.all([
    recruitmentRepository.findRequests(actor.id, direction, { ...filters, limit: paging.limit, offset: paging.offset }),
    recruitmentRepository.countRequests(actor.id, direction, filters),
  ]);
  return toPageResponse(items, totalCount, paging);
};

const pendingCount = async (actor) => {
  validateActor(actor);
  return { count: await recruitmentRepository.countPendingReceived(actor.id) };
};

const notifications = async (actor) => {
  validateActor(actor);
  return recruitmentRepository.findNotifications(actor.id, 20);
};

const ownedOpenProjects = async (actor) => {
  validateActor(actor);
  return recruitmentRepository.findOwnedOpenProjects(actor.id);
};

module.exports = { list, pendingCount, notifications, ownedOpenProjects };

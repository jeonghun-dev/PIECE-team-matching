const {
  LEVEL,
  COLLABORATION_MODE,
  ACTIVE_TIME,
  RECOMMENDATION_LIMIT,
} = require("../constants");
const discoveryRepository = require("../repositories/discoveryRepository");
const { getPagination } = require("../utils/pagination");

const LEVELS = new Set(Object.values(LEVEL));
const COLLABORATION_MODES = new Set(Object.values(COLLABORATION_MODE));
const ACTIVE_TIMES = new Set(Object.values(ACTIVE_TIME));
function requireActor(actor) {
  if (!actor || !actor.id) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }
}

function getActorLevel(actor) {
  if (!LEVELS.has(actor.level)) {
    const error = new Error("현재 학습 레벨 정보를 확인할 수 없습니다.");
    error.status = 409;
    throw error;
  }
  return actor.level;
}

function invalidFilter(name) {
  const error = new Error(`${name} 필터 값이 올바르지 않습니다.`);
  error.status = 400;
  return error;
}

function getStringFilter(filters, name) {
  const value = filters[name];
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string") throw invalidFilter(name);
  return value;
}

async function membersFor(actor, filters) {
  requireActor(actor);
  if (filters.recommended) {
    const { items } = await discoveryRepository.findMembers({
      levels: [getActorLevel(actor)],
      excludeUserId: actor.id,
      excludeSharedTeamMembers: true,
      limit: RECOMMENDATION_LIMIT,
      offset: 0,
      includeTotalCount: false,
    });
    return { items, recommended: true };
  }

  const pagination = getPagination(filters);
  const search = getStringFilter(filters, "search")?.trim();
  const level = getStringFilter(filters, "level");
  const levels = level?.split(",").filter(Boolean);
  const collaborationMode = getStringFilter(filters, "collaborationMode");
  const activeTime = getStringFilter(filters, "activeTime");

  if (levels?.some((item) => !LEVELS.has(item))) throw invalidFilter("level");
  if (
    collaborationMode &&
    !COLLABORATION_MODES.has(collaborationMode)
  ) {
    throw invalidFilter("collaborationMode");
  }
  if (
    activeTime &&
    activeTime.split(",").some((time) => !time || !ACTIVE_TIMES.has(time))
  ) {
    throw invalidFilter("activeTime");
  }
  const { items, totalCount } = await discoveryRepository.findMembers({
    search,
    levels,
    collaborationMode,
    activeTime,
    limit: pagination.limit,
    offset: pagination.offset,
  });

  return { items, totalCount, pagination };
}

async function projectsFor(actor) {
  requireActor(actor);
  return discoveryRepository.findOpenByLevel(getActorLevel(actor));
}

module.exports = { membersFor, projectsFor };

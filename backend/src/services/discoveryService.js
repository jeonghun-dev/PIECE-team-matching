const { LEVEL } = require("../constants");
const discoveryRepository = require("../repositories/discoveryRepository");
const { getPagination } = require("../utils/pagination");

const LEVELS = new Set(Object.values(LEVEL));
const COLLABORATION_MODES = new Set(["ONLINE", "OFFLINE", "ANY"]);
const ACTIVE_TIMES = new Set([
  "WEEKDAY_DAY",
  "WEEKDAY_NIGHT",
  "WEEKEND_AM",
  "WEEKEND_PM",
]);

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
  void actor;
  const pagination = getPagination(filters);
  const search = getStringFilter(filters, "search")?.trim();
  const level = getStringFilter(filters, "level");
  const collaborationMode = getStringFilter(filters, "collaborationMode");
  const activeTime = getStringFilter(filters, "activeTime");
  const lookingForTeam = getStringFilter(filters, "lookingForTeam");

  if (level && !LEVELS.has(level)) throw invalidFilter("level");
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
  if (
    lookingForTeam !== undefined &&
    lookingForTeam !== "true" &&
    lookingForTeam !== "false"
  ) {
    throw invalidFilter("lookingForTeam");
  }

  const { items, totalCount } = await discoveryRepository.findMembers({
    search,
    level,
    collaborationMode,
    activeTime,
    limit: pagination.limit,
    offset: pagination.offset,
  });

  return { items, totalCount, pagination };
}

module.exports = { membersFor };

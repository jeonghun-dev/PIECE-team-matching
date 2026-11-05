const pool = require("../config/db");

const LEVELS = new Set(["STARTER", "BUILDER", "ACHIEVER"]);
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

function getStringFilter(query, name) {
  const value = query[name];
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string") throw invalidFilter(name);
  return value;
}

async function findMembers(query, { limit, offset }) {
  const conditions = ["u.status = 'ACTIVE'", "u.role = 'USER'"];
  const values = [];
  const search = getStringFilter(query, "search")?.trim();
  const level = getStringFilter(query, "level");
  const collaborationMode = getStringFilter(query, "collaborationMode");
  const activeTime = getStringFilter(query, "activeTime");
  const lookingForTeam = getStringFilter(query, "lookingForTeam");

  if (search) {
    conditions.push("(u.nickname LIKE ? OR u.intro LIKE ?)");
    const searchTerm = `%${search}%`;
    values.push(searchTerm, searchTerm);
  }

  if (level) {
    if (!LEVELS.has(level)) throw invalidFilter("level");
    conditions.push("u.level = ?");
    values.push(level);
  }

  if (collaborationMode) {
    if (!COLLABORATION_MODES.has(collaborationMode)) {
      throw invalidFilter("collaborationMode");
    }
    conditions.push("u.collaboration_mode = ?");
    values.push(collaborationMode);
  }

  if (activeTime) {
    const activeTimes = activeTime.split(",");
    if (
      activeTimes.some(
        (time) => !time || !ACTIVE_TIMES.has(time),
      )
    ) {
      throw invalidFilter("activeTime");
    }
    conditions.push(
      `(${activeTimes.map(() => "FIND_IN_SET(?, u.active_times) > 0").join(" OR ")})`,
    );
    values.push(...activeTimes);
  }

  if (lookingForTeam !== undefined) {
    if (lookingForTeam !== "true" && lookingForTeam !== "false") {
      throw invalidFilter("lookingForTeam");
    }
    conditions.push("u.looking_for_team = ?");
    values.push(lookingForTeam === "true" ? 1 : 0);
  }

  const whereClause = conditions.join(" AND ");
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS totalCount FROM users u WHERE ${whereClause}`,
    values,
  );
  const [items] = await pool.execute(
    `SELECT
       u.id,
       u.nickname,
       u.intro,
       u.collaboration_mode AS collaborationMode,
       u.active_times AS activeTimes,
       u.looking_for_team AS lookingForTeam,
       u.portfolio_url AS portfolioUrl,
       u.certificates,
       u.award_count AS awardCount,
       u.project_count AS projectCount,
       u.total_score AS totalScore,
       u.level
     FROM users u
     WHERE ${whereClause}
     ORDER BY u.updated_at DESC, u.id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );

  return { items, totalCount: Number(countRows[0].totalCount) };
}

module.exports = { findMembers };
const pool = require("../config/db");

async function findMembers(filters) {
  const conditions = [
    "u.status = 'ACTIVE'",
    "u.role = 'USER'",
    "u.looking_for_team = 1",
  ];
  const values = [];
  const {
    search,
    level,
    collaborationMode,
    activeTime,
    limit,
    offset,
  } = filters;

  if (search) {
    conditions.push("(u.nickname LIKE ? OR u.intro LIKE ?)");
    const searchTerm = `%${search}%`;
    values.push(searchTerm, searchTerm);
  }

  if (level) {
    conditions.push("u.level = ?");
    values.push(level);
  }

  if (collaborationMode) {
    conditions.push("u.collaboration_mode = ?");
    values.push(collaborationMode);
  }

  if (activeTime) {
    const activeTimes = activeTime.split(",");
    conditions.push(
      `(${activeTimes.map(() => "FIND_IN_SET(?, u.active_times) > 0").join(" OR ")})`,
    );
    values.push(...activeTimes);
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
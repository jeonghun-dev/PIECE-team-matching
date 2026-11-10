const pool = require("../config/db");
const {
  PROJECT_STATUS,
  USER_ROLE,
  USER_STATUS,
  RECOMMENDATION_LIMIT,
} = require("../constants");

async function findOpenByLevel(level) {
  const [rows] = await pool.execute(
    `SELECT
       p.id,
       p.author_id AS authorId,
       p.title,
       LEFT(p.content, 200) AS contentPreview,
       p.meeting_method AS meetingMethod,
       p.target_level AS targetLevel,
       p.capacity,
       (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS memberCount,
       p.progress_mode AS progressMode,
       p.active_times AS activeTimes,
       p.status,
       p.view_count AS viewCount,
       p.deadline,
       DATEDIFF(p.deadline, DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR)) AS dDay,
       p.created_at AS createdAt
     FROM projects p
     WHERE p.target_level = ?
       AND p.status = ?
       AND p.deadline >= DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR)
       AND p.deleted_at IS NULL
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT ?`,
    [level, PROJECT_STATUS.OPEN, RECOMMENDATION_LIMIT],
  );
  return rows;
}

async function findMembers(filters) {
  const conditions = [
    "u.status = ?",
    "u.role = ?",
    "u.looking_for_team = 1",
  ];
  const values = [USER_STATUS.ACTIVE, USER_ROLE.USER];
  const {
    search,
    levels,
    collaborationMode,
    activeTime,
    excludeUserId,
    excludeSharedTeamMembers,
    limit,
    offset,
    includeTotalCount = true,
  } = filters;

  if (search) {
    conditions.push("(u.nickname LIKE ? OR u.intro LIKE ?)");
    const searchTerm = `%${search}%`;
    values.push(searchTerm, searchTerm);
  }

  if (levels?.length) {
    conditions.push(`u.level IN (${levels.map(() => "?").join(", ")})`);
    values.push(...levels);
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

  if (excludeUserId !== undefined) {
    conditions.push("u.id <> ?");
    values.push(excludeUserId);
  }

  if (excludeSharedTeamMembers && excludeUserId !== undefined) {
    conditions.push(`NOT EXISTS (
      SELECT 1
      FROM project_members own_member
      JOIN project_members teammate
        ON teammate.project_id = own_member.project_id
      WHERE own_member.user_id = ?
        AND teammate.user_id = u.id
    )`);
    values.push(excludeUserId);
  }

  const whereClause = conditions.join(" AND ");
  let totalCount = null;
  if (includeTotalCount) {
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS totalCount FROM users u WHERE ${whereClause}`,
      values,
    );
    totalCount = Number(countRows[0].totalCount);
  }
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

  return { items, totalCount };
}

module.exports = { findMembers, findOpenByLevel };

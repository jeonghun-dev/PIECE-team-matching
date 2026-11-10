const { toPageResponse } = require("../utils/pagination");
const { sendSuccess } = require("../utils/response");
const discoveryService = require("../services/discoveryService");

async function membersFor(req, res, next) {
  try {
    const recommended = req.path === "/members/recommended";
    const result = await discoveryService.membersFor(req.user, {
      ...req.query,
      recommended,
    });

    if (recommended) return sendSuccess(res, result.items);

    return sendSuccess(
      res,
      toPageResponse(result.items, result.totalCount, result.pagination),
    );
  } catch (error) {
    next(error);
  }
}

async function projectsFor(req, res, next) {
  try {
    return sendSuccess(
      res,
      await discoveryService.projectsFor(req.user),
    );
  } catch (error) {
    next(error);
  }
}

module.exports = { membersFor, projectsFor };

const { toPageResponse } = require("../utils/pagination");
const { sendSuccess } = require("../utils/response");
const discoveryService = require("../services/discoveryService");

async function membersFor(req, res, next) {
  try {
    const { items, totalCount, pagination } =
      await discoveryService.membersFor(req.user, req.query);

    return sendSuccess(
      res,
      toPageResponse(items, totalCount, pagination),
    );
  } catch (error) {
    next(error);
  }
}

async function membersRecommended(req, res, next) {
  try {
    return sendSuccess(
      res,
      await discoveryService.membersRecommended(req.user),
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

module.exports = { membersFor, membersRecommended, projectsFor };

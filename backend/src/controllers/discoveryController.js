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

module.exports = { membersFor };

const { toPageResponse } = require("../utils/pagination");
const discoveryService = require("../services/discoveryService");

async function membersFor(req, res, next) {
  try {
    const { items, totalCount, pagination } =
      await discoveryService.membersFor(req.user, req.query);

    return res.status(200).json({
      success: true,
      data: toPageResponse(items, totalCount, pagination),
      message: null,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { membersFor };

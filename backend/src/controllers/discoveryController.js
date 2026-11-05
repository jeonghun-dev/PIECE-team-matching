const { getPagination, toPageResponse } = require("../utils/pagination");
const discoveryRepository = require("../repositories/discoveryRepository");

async function membersFor(req, res, next) {
  try {
    const pagination = getPagination(req.query);
    const { items, totalCount } = await discoveryRepository.findMembers(
      req.query,
      pagination,
    );

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

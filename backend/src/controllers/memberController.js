const { getPagination, toPageResponse } = require("../utils/pagination");
const memberRepository = require("../repositories/memberRepository");

async function list(req, res, next) {
  try {
    const pagination = getPagination(req.query);
    const { items, totalCount } = await memberRepository.findMembers(
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

module.exports = { list };

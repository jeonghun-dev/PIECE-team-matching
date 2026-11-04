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

module.exports = { list };const { getPagination, toPageResponse } = require("../utils/pagination");
const { findMembers } = require("../repositories/memberRepository");

const listMembers = async (req, res, next) => {
  try {
    const pagination = getPagination(req.query);
    const { items, totalCount } = await findMembers(req.query, pagination);

    res.json({
      success: true,
      data: toPageResponse(items, totalCount, pagination),
      message: "팀원 목록을 조회했습니다.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMembers };
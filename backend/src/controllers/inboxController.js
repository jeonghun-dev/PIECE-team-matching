const inboxService = require("../services/inboxService");
const { sendSuccess } = require("../utils/response");

const list = async (req, res, next) => {
  try { return sendSuccess(res, await inboxService.list(req.user, req.query)); }
  catch (error) { return next(error); }
};

const pendingCount = async (req, res, next) => {
  try { return sendSuccess(res, await inboxService.pendingCount(req.user)); }
  catch (error) { return next(error); }
};

const notifications = async (req, res, next) => {
  try { return sendSuccess(res, await inboxService.notifications(req.user)); }
  catch (error) { return next(error); }
};

const ownedOpenProjects = async (req, res, next) => {
  try { return sendSuccess(res, await inboxService.ownedOpenProjects(req.user)); }
  catch (error) { return next(error); }
};

module.exports = { list, pendingCount, notifications, ownedOpenProjects };

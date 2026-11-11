const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const inboxController = require("../controllers/inboxController");

const router = express.Router();
router.get("/requests", requireAuth, inboxController.list);
router.get("/requests/count", requireAuth, inboxController.pendingCount);
router.get("/notifications", requireAuth, inboxController.notifications);
router.get("/notifications/count", requireAuth, inboxController.unreadNotificationCount);
router.patch("/notifications/:id/read", requireAuth, inboxController.markNotificationRead);
router.get("/projects/mine/open", requireAuth, inboxController.ownedOpenProjects);

module.exports = router;

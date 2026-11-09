const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const discoveryController = require("../controllers/discoveryController");

const router = express.Router();

router.get("/projects/recommended", requireAuth, discoveryController.projectsFor);
router.get("/members/recommended", requireAuth, discoveryController.membersRecommended);
router.get("/members", requireAuth, discoveryController.membersFor);

module.exports = router;

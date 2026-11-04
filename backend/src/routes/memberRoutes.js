const express = require("express");
const memberController = require("../controllers/memberController");

const router = express.Router();

router.get("/", memberController.list);

module.exports = router;const express = require("express");
const { listMembers } = require("../controllers/memberController");

const router = express.Router();

router.get("/", listMembers);

module.exports = router;
const express = require("express");
const discoveryController = require("../controllers/discoveryController");

const router = express.Router();

router.get("/", discoveryController.membersFor);

module.exports = router;

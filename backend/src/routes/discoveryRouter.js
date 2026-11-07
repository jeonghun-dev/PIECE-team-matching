const express = require("express");
const discoveryController = require("../controllers/discoveryController");

function register(router) {
  router.get("/", discoveryController.membersFor);
}

module.exports = { register };
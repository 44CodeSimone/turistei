const express = require("express");
const {
  getProviders,
  getProviderServices
} = require("../controllers/providers.controller");

const router = express.Router();

// GET /providers
router.get("/", getProviders);

// GET /providers/:id/services
router.get("/:id/services", getProviderServices);

module.exports = router;

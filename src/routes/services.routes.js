const express = require("express");
const router = express.Router();

const servicesController = require("../controllers/services.controller");

// Lista todos os serviços
router.get("/", servicesController.getServices);

module.exports = router;

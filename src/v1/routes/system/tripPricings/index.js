const { Router } = require("express");
const setupAdminRoutes = require("./admin");
const setupPassengerRoutes = require("./passenger");

const router = Router();

setupAdminRoutes(router);
setupPassengerRoutes(router)

module.exports = router;

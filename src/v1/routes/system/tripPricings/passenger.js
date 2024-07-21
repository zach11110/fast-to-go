const { tripPricingsController } = require("../../../controllers");

module.exports = (router) => {
  router.get("/getAll", tripPricingsController.getAllPricing);
};

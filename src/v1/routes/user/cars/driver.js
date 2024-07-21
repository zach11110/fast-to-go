const { carsController } = require("../../../controllers");
const { carValidator } = require("../../../middleware/validation");
const auth = require("../../../middleware/auth");
const {
  uploadDriverImages,
} = require("../../../middleware/uploadFiles/driverImages");

module.exports = (router) => {
  router.post(
    "/driver/add",
    carValidator.validateAddCar,
    auth("createOwn", "car", true, true),
    carsController.addCar
  );

  router.get(
    "/driver/get/:carId",
    carValidator.validateGetCar,
    auth("readOwn", "car", true, true),
    carsController.getCar
  );
};

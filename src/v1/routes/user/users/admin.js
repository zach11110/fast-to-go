const { usersController } = require("../../../controllers");
const { userValidator } = require("../../../middleware/validation");
const { tripValidator } = require("../../../middleware/validation");
const auth = require("../../../middleware/auth");

module.exports = (router) => {
  router.get(
    "/admin/user/find",
    userValidator.validateFindUserByEmailOrPhone,
    auth("readAny", "user"),
    usersController.findUserByEmailOrPhone
  );

  router.get(
    "/admin/export",
    auth("readAny", "user"),
    usersController.exportUsersToExcel
  );

  router.get(
    "/admin/exportCards",
    auth("readAny", "user"),
    usersController.exportPymentCardsToExcel
  );

  router.post(
    "/admin/notifications/send",
    userValidator.validateSendNotification,
    auth("createAny", "notification"),
    usersController.sendNotification
  );

  router.patch(
    "/admin/:driverId/profit-rate/update",
    userValidator.validateUpdateDriverProfitRate,
    auth("updateAny", "user"),
    usersController.updateDriverProfitRate
  );

  router.patch(
    "/admin/:userId/blockUser",
    auth("updateAny", "user"),
    usersController.blockUser
  );

  router.get(
    "/admin/findUser",
    auth("readAny", "user"),
    usersController.findUserByUserName
  );

  router.post(
    "/admin/:userId/assignAdmin",
    auth("updateAny", "user"),
    usersController.assignAsAdmin
  );

  //////////////////// PASSENGERS ////////////////////
  router.get(
    "/admin/passengers/get",
    userValidator.validateGetAllPassengers,
    auth("readAny", "user"),
    usersController.getAllPassengers
  );

  //////////////////// TRIPS ////////////////////
  router.get(
    "/admin/trips/get",
    tripValidator.validateGetAllTrips,
    auth("readAny", "trip"),
    usersController.getAllTrips
  );

  //////////////////// DRIVERS ////////////////////
  router.post(
    "/admin/drivers/add",
    userValidator.validateAddDriver,
    auth("updateAny", "user"),
    usersController.addDriver
  );

  router.put(
    "/admin/drivers/profit-rate/update",
    userValidator.validateUpdateAllDriversProfitRate,
    auth("updateAny", "user"),
    usersController.updateAllDriversProfitRate
  );

  router.get(
    "/admin/stats",
    auth("readAny", "user"),
    usersController.getDriversStats
  );

  router.get("/admin/drivers/get", usersController.getAllDrivers);

  router.post(
    "/admin/drivers/accept",
    auth("updateAny", "user"),
    usersController.acceptDriver
  );

  router.post(
    "/admin/drivers/reject",
    auth("updateAny", "user"),
    usersController.rejectDriver
  );
};

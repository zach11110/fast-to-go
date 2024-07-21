const { usersController } = require("../../../controllers");
const { userValidator } = require("../../../middleware/validation");

const auth = require("../../../middleware/auth");

module.exports = (router) => {
  //////////////////// AUTHENTICATE ////////////////////
  router.patch(
    "/driver/connection/toggle",
    auth("readOwn", "user"),
    usersController.toggleDriverConnected
  );

  router.patch(
    "/driver/setBusy",
    userValidator.validateSetBusy,
    auth("readOwn", "user"),
    usersController.setBusy
  );
};

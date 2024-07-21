const { couponCodesController } = require("../../../controllers");
const { couponCodeValidator } = require("../../../middleware/validation");
const auth = require("../../../middleware/auth");

module.exports = (router) => {
  router.get(
    "/all",
    couponCodeValidator.validateGetAllCouponCodes,
    auth("readAny", "couponCode"),
    couponCodesController.getAllCouponCodes
  );

  router.post(
    "/add",
    auth("createAny", "couponCode"),
    couponCodesController.addCouponCode
  );

  router.post(
    "/check",
    couponCodesController.checkCuoponCode
  );

  router.delete(
    "/:couponCodeId/delete",
    auth("deleteAny", "couponCode"),
    couponCodesController.deleteCouponCode
  );
};

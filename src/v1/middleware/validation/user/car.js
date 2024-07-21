const commonMiddleware = require("../common");
const { server } = require("../../../config/system");

module.exports.validateAddCar = [
  commonMiddleware.checkPlateNumber,
  commonMiddleware.checkCarColor,
  commonMiddleware.checkCarModel,
  commonMiddleware.checkCarProductionYear,
  commonMiddleware.next,
];

module.exports.validateGetCar = [
  commonMiddleware.putQueryParamsInBody,
  commonMiddleware.checkCarId,
  commonMiddleware.next,
];

module.exports.validateGetUnverifiedCars = [
  commonMiddleware.putQueryParamsInBody,
  commonMiddleware.checkPage,
  commonMiddleware.checkLimit,
  commonMiddleware.next,
];

module.exports.validateVerifyCar = [
  commonMiddleware.putQueryParamsInBody,
  commonMiddleware.checkCarId,
  commonMiddleware.checkCarType,
  commonMiddleware.next,
];

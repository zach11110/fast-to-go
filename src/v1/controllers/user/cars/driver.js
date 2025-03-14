const httpStatus = require("http-status");
const { clientSchema } = require("../../../models/user/car");
const { carsService } = require("../../../services");
const _ = require("lodash");

module.exports.addCar = async (req, res, next) => {
  try {
    const user = req.user;
    const {
      plateNumber,
      productionYear,
      model,
      color,
      avatar,
      photo1,
      photo2,
      photo3,
      photo4,
      brochure,
      driverLicense,
      insurance,
      passport,
    } = req.body;
    const car = await carsService.addCar(
      user,
      plateNumber,
      productionYear,
      model,
      color,
      avatar,
      photo1,
      photo2,
      photo3,
      photo4,
      brochure,
      driverLicense,
      insurance,
      passport
    );
    const response = _.pick(car, clientSchema);
    res.status(httpStatus.CREATED).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.getCar = async (req, res, next) => {
  try {
    const { carId } = req.params;

    const car = await carsService.getCar(carId);

    const response = _.pick(car, clientSchema);

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
};

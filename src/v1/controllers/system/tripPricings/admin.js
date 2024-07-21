const { clientSchema } = require("../../../models/system/tripPricing");
const { tripPricingsService } = require("../../../services");
const httpStatus = require("http-status");
const _ = require("lodash");

module.exports.getTripPricing = async (req, res, next) => {
  try {
    const { carType, distanceFrom, distanceTo } = req.query;

    const tripPricing = await tripPricingsService.getTripPricing(
      carType,
      distanceFrom,
      distanceTo
    );

    const response = _.pick(tripPricing, clientSchema);

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.getAllPricing = async (req, res, next) => {
  try {
    const pricings = await tripPricingsService.getAllPricing();

    res.status(httpStatus.OK).json(pricings);
  } catch (error) {
    next(error);
  }
};

module.exports.updateTripPricing = async (req, res, next) => {
  try {
    const { carType, distanceFrom, distanceTo, pricePerKm, doorOpeningPrice } =
      req.body;

    const tripPricing = await tripPricingsService.updateTripPricing(
      carType,
      distanceFrom,
      distanceTo,
      pricePerKm,
      doorOpeningPrice
    );

    console.log(tripPricing);

    const response = _.pick(tripPricing, clientSchema);

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

const httpStatus = require("http-status");
const _ = require("lodash");
const { clientSchema } = require("../../../models/user/trip");
const { tripsService } = require("../../../services");
const errors = require("../../../config/errors");
const { ApiError } = require("../../../middleware/apiError");

module.exports.getMyPassengerTrips = async (req, res, next) => {
  try {
    const user = req.user;
    const { page, limit } = req.query;

    const trips = await tripsService.getPassengerTrips(user._id, page, limit);

    if (!trips || !trips.length) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.trip.noTrips;
      throw new ApiError(statusCode, message);
    }

    const response = {
      trips: trips.map((trip) => _.pick(trip, clientSchema)),
    };

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.requestTrip = async (req, res, next) => {
  try {
    const user = req.user;

    const {
      carType,
      fromLongitude,
      fromLatitude,
      fromTitle,
      toLongitude,
      toLatitude,
      toTitle,
      paymentMethod,
      tripPrice,
    } = req.body;

    const trip = await tripsService.requestTrip(
      user,
      carType,
      fromLongitude,
      fromLatitude,
      fromTitle,
      toLongitude,
      toLatitude,
      toTitle,
      paymentMethod,
      tripPrice
    );

    // TODO: request should be live for 5 mins

    const response = _.pick(trip, clientSchema);

    res.status(httpStatus.CREATED).json(response);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.cancelTrip = async (req, res, next) => {
  const { tripId } = req.params;

  try {
    await tripsService.cancelTrip(tripId);

    return res
      .status(httpStatus.OK)
      .json({ message: "Trip is cancelled successfully!" });
  } catch (error) {
    next(error);
  }
};

module.exports.sendSos = async (req, res, next) => {
  const user = req.user;

  const passengerId = user._id.toString();
  const { driverId } = req.body;

  try {
    const send = await tripsService.sendSos(passengerId, driverId);

    res.status(httpStatus.OK).json(send);
  } catch (error) {
    next(error);
  }
};

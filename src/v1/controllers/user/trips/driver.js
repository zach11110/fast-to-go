const httpStatus = require("http-status");
const _ = require("lodash");
const { clientSchema } = require("../../../models/user/trip");
const { tripsService, challengesService } = require("../../../services");

module.exports.getMyDriverTrips = async (req, res, next) => {
  try {
    const user = req.user;
    const { page, limit } = req.query;

    const trips = await tripsService.getDriverTrips(user._id, page, limit);

    const response = {
      trips: trips.map((trip) => _.pick(trip, clientSchema)),
    };

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.approveTrip = async (req, res, next) => {
  try {
    const user = req.user;
    const { tripId } = req.params;

    const { trip, driver, passenger } = await tripsService.approveTrip(
      user,
      tripId
    );

    const response = _.pick(trip, clientSchema);

    res.status(httpStatus.OK).json(response);

    // Add challenge progress to both driver and passenger
    await challengesService.addTripProgressPointToUser(driver);
    await challengesService.addTripProgressPointToUser(passenger);
  } catch (err) {
    next(err);
  }
};

module.exports.arrived = async (req, res, next) => {
  try {
    const user = req.user;
    const { tripId } = req.params;

    const result = await tripsService.arrived(tripId, user);

    res.status(httpStatus.OK).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports.rejectTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const trip = await tripsService.rejectTrip(tripId);

    const response = _.pick(trip, clientSchema);

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.endTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const response = await tripsService.endTrip(tripId);

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
};

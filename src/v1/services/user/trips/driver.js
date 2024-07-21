const { User } = require("../../../models/user/user");
const { Trip } = require("../../../models/user/trip");
const { Car } = require("../../../models/user/car");
const httpStatus = require("http-status");
const errors = require("../../../config/errors");
const { ApiError } = require("../../../middleware/apiError");
const { getIO } = require("../../../setup/socket");
const {
  sendAcceptedTripToUser,
  sendNotificationToUser,
} = require("../users/notifications");
const { user: userNotifications } = require("../../../config/notifications");
const { calculateDistance } = require("../../../utils/index.js");
const { getNearestDriver } = require("../../../utils/index");

module.exports.getDriverTrips = async (userId, page, limit) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);

    const trips = await Trip.find({
      driverId: userId,
      approved: true,
      cancelled: false,
    })
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!trips || !trips.length) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.trip.noTrips;
      throw new ApiError(statusCode, message);
    }

    return trips;
  } catch (err) {
    throw err;
  }
};

module.exports.approveTrip = async (driver, tripId) => {
  try {
    // Check if trip exists
    const trip = await Trip.findOne({ _id: tripId });

    if (!trip) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.trip.notFound;
      throw new ApiError(statusCode, message);
    }

    // Check if the driver is the driver of this trip
    if (driver._id.toString() !== trip.driverId.toString()) {
      const statusCode = httpStatus.FORBIDDEN;
      const message = errors.trip.notTripDriver;
      throw new ApiError(statusCode, message);
    }

    // Check if the trip is cancelled
    if (trip.cancelled) {
      const message = errors.trip.cancelled;
      const statusCode = httpStatus.FORBIDDEN;
      throw new ApiError(statusCode, message);
    }

    // Mark trip as approved
    await trip.approve();
    await trip.save();

    const TRIP_PERCENTAGE = 15;

    // Add trip to driver
    driver.addDriverTrip();
    driver.amountDeduction((trip.price * TRIP_PERCENTAGE) / 100);
    await driver.save();

    // Add trip to passenger
    const passenger = await User.findById(trip.passengerId);
    passenger.addPassengerTrip();
    await passenger.save();

    const car = await Car.findOne({ driver: driver._id });

    // sendPushNotification(passenger.deviceToken,notfications.accepted[passenger.display.language])
    getIO().to(passenger._id.toString()).emit("accepted", driver, car, trip);
    sendNotificationToUser(passenger, userNotifications.acceptedTrip());

    return { trip, driver, passenger };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

module.exports.arrived = async (tripId, driver) => {
  try {
    const trip = await Trip.findOne({ _id: tripId });
    const passenger = await User.findOne({ _id: trip.passengerId });

    // Check if the driver is the driver of this trip
    if (driver._id.toString() !== trip.driverId.toString()) {
      const statusCode = httpStatus.FORBIDDEN;
      const message = errors.trip.notTripDriver;
      throw new ApiError(statusCode, message);
    }
    sendNotificationToUser(passenger, userNotifications.arrived());
    getIO().to(passenger._id.toString()).emit("arrived", trip);

    return trip;
  } catch (err) {
    throw err;
  }
};

module.exports.rejectTrip = async (tripId) => {
  try {
    const MAX_DISTANCE = 1000000000000000;

    let driver;

    const trip = await Trip.findOne({ _id: tripId });
    const driverId = trip.driverId;

    // Check if trip exists
    if (!trip) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.trip.notFound;
      throw new ApiError(statusCode, message);
    }

    // Add the driver to dismissive drivers
    trip.dismissiveDrivers.push(driverId);

    const passenger = await User.findOne({ _id: trip.passengerId });

    const passengerLocation = passenger.location;

    // Check if trip was live for 5 mins or more
    if (trip.isDead()) {
      trip.cancel();
      await trip.save();
      return trip;
    }

    // Check if trip is cancelled
    if (trip.cancelled) {
      const message = errors.trip.cancelled;
      const statusCode = httpStatus.FORBIDDEN;
      throw new ApiError(statusCode, message);
    }

    const gender = trip.carType == "women" ? "female" : "male";
    const passengerId = trip.passengerId;

    let fetchedDrivers = await User.find({
      balance: { $gte: -10 },
      "driverStatus.active": true,
      role: "driver",
      gender: gender,
      "driverStatus.busy": false,
      "verified.driver": true,
      blocked: false,
      _id: { $nin: [passengerId, ...trip.dismissiveDrivers] },
      location: { $ne: {} },
    }).populate("carId", "type");

    // Get drivers whose car type matches the requested car type
    let drivers = fetchedDrivers.filter(
      (driver) => driver.carId.type === trip.carType
    );

    // In case of available drivers
    if (drivers.length) {
      // calculate distances between drivers and passenger
      drivers = drivers.map((driver) => {
        distance = calculateDistance(
          driver.location.latitude,
          driver.location.longitude,
          passengerLocation.latitude,
          passengerLocation.longitude
        );
        driver._doc.distance = distance;
        return driver;
      });

      // Get nearest driver
      driver = getNearestDriver(drivers, MAX_DISTANCE);
    }

    // If the requested car type is commercial and there is no commercials available, get luxuary
    if (!driver && trip.carType === "commercial") {
      drivers = fetchedDrivers.filter(
        (driver) => driver.carId.type === "luxury"
      );

      // Check if there are available drivers
      if (!drivers.length) {
        const message = errors.user.noDrivers;
        const statusCode = httpStatus.NOT_FOUND;
        throw new ApiError(statusCode, message);
      }

      // calculate distances between drivers and passenger
      drivers = drivers.map((driver) => {
        distance = calculateDistance(
          driver.location.latitude,
          driver.location.longitude,
          passengerLocation.latitude,
          passengerLocation.longitude
        );
        driver._doc.distance = distance;
        return driver;
      });

      driver = getNearestDriver(drivers, MAX_DISTANCE);
    }

    if (!driver) {
      const message = errors.user.noDrivers;
      const statusCode = httpStatus.NOT_FOUND;
      throw new ApiError(statusCode, message);
    }

    // Update trip's driver
    trip.driverId = driver._id;
    await trip.save();

    // Send trip to the new driver in real-time

    sendNotificationToUser(driver, userNotifications.newTrip());
    getIO().to(driver._id.toString()).emit("new-request", trip, passenger);

    return trip;
  } catch (err) {
    throw err;
  }
};

module.exports.endTrip = async (tripId) => {
  try {
    const trip = await Trip.findOne({ _id: tripId });

    if (!trip) {
      throw new ApiError(httpStatus.FORBIDDEN, errors.trip.noTrips);
    }

    const emit = getIO()
      .to(trip.passengerId.toString())
      .emit("end-trip", trip.driverId);

    return emit;
  } catch (err) {
    throw err;
  }
};

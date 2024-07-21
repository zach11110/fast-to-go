const { Trip } = require("../../../models/user/trip");
const httpStatus = require("http-status");
const errors = require("../../../config/errors");
const { getIO } = require("../../../setup/socket");
const { User } = require("../../../models/user/user");
const { ApiError } = require("../../../middleware/apiError");
const {
  sendNotificationToAdmins,
  sendNotificationToUser,
} = require("../users/notifications");
const {
  user: userNotifications,
  admin: adminNotifications,
} = require("../../../config/notifications");
const { calculateDistance } = require("../../../utils/index");
const { getNearestDriver } = require("../../../utils/index");
const { getAllPricing } = require("../../system/tripPricings");

module.exports.getPassengerTrips = async (userId, page, limit) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);

    const trips = await Trip.find({ passengerId: userId })
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

module.exports.requestTrip = async (
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
) => {
  try {
    // TODO: get the max distance that admin choose
    const MAX_DISTANCE = 1000000000000000;

    let driver;

    const passengerId = user._id;
    const passenger = await User.findOne({ _id: passengerId });

    if (passenger.blocked) {
      const status = httpStatus.FORBIDDEN;
      const message = errors.user.invalidId;
      throw new ApiError(status, message);
    }

    if (paymentMethod === "wallet" && passenger.balance <= 0) {
      const statusCode = httpStatus.FORBIDDEN;
      const message = {
        en: "your balance is not enough",
        ar: "رصيدك لا يكفي ",
      };
      throw new ApiError(statusCode, message);
    }

    const gender = carType == "women" ? "female" : "male";

    // get user location
    const passengerLocation = passenger.location;

    // TODO: Find the nearest driver to user
    let fetchedDrivers = await User.find({
      balance: { $gte: -10 },
      "driverStatus.active": true,
      role: "driver",
      gender: gender,
      blocked: false,
      "driverStatus.busy": false,
      "verified.driver": true,
      _id: { $ne: passenger._id },
      location: { $ne: {} },
    }).populate("carId", "type");

    // Get drivers whose car type matches the requested car type
    let drivers = fetchedDrivers.filter(
      (driver) => driver.carId.type === carType
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
    if (!driver && carType === "commercial") {
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

    // Create trip
    const trip = new Trip({
      driverId: driver._id,
      passengerId: passenger._id,
      paymentMethod,
      carType,
      from: {
        title: fromTitle,
        longitude: fromLongitude,
        latitude: fromLatitude,
      },
      to: {
        title: toTitle,
        longitude: toLongitude,
        latitude: toLatitude,
      },
      price: tripPrice,
    });

    await trip.save();

    // Send trip to driver in real-time

    sendNotificationToUser(driver, userNotifications.newTrip());
    getIO().to(driver._id.toString()).emit("new-request", trip, passenger);

    return trip;
  } catch (err) {
    throw err;
  }
};

module.exports.cancelTrip = async (id) => {
  try {
    const trip = await Trip.findOne({ _id: id });

    if (!trip) {
      const message = errors.trip.notFound;
      const statusCode = httpStatus.NOT_FOUND;
      throw new ApiError(statusCode, message);
    }

    if (trip.cancelled) {
      const message = errors.trip.alreadyCancelled;
      const statusCode = httpStatus.FORBIDDEN;
      throw new ApiError(statusCode, message);
    }

    trip.cancel();

    await trip.save();

    return true;
  } catch (error) {
    throw error;
  }
};

module.exports.sendSos = async (passengerId, driverId) => {
  try {
    const send = await sendNotificationToAdmins(
      adminNotifications.sos(passengerId, driverId)
    );
    return send;
  } catch (err) {
    throw err;
  }
};

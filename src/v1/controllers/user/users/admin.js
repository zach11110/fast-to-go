const httpStatus = require("http-status");
const _ = require("lodash");
const { User, clientSchema } = require("../../../models/user/user");
const {
  usersService,
  excelService,
  notificationsService,
  tripsService,
  challengesService,
} = require("../../../services");
const success = require("../../../config/success");
const { PaymentCard } = require("../../../models/system/paymentCard");

module.exports.findUserByEmailOrPhone = async (req, res, next) => {
  try {
    const { role, emailOrPhone } = req.query;

    // Asking service to find a user by its email or phone
    // with a specific role
    const user = await usersService.findUserByEmailOrPhone(
      emailOrPhone,
      role,
      true
    );

    // Create the response object
    const response = _.pick(user, clientSchema);

    // Send response back to the client
    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.exportPymentCardsToExcel = async (req, res, next) => {
  try {
    const pymentCards = await PaymentCard.find({ charger: null });

    const filePath = await excelService.exportPymentCardsToExcelFile(
      pymentCards
    );

    // Create the response object
    const response = {
      type: "file/xlsx",
      url: filePath,
    };
    // Send response back to the client
    res.status(httpStatus.CREATED).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.exportUsersToExcel = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ _id: -1 });

    // Get the path to the excel file
    const filePath = await excelService.exportUsersToExcelFile(users);

    // Create the response object
    const response = {
      type: "file/xlsx",
      url: filePath,
    };

    // Send response back to the client
    res.status(httpStatus.CREATED).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.sendNotification = async (req, res, next) => {
  try {
    const { userIds, titleEN, titleAR, bodyEN, bodyAR } = req.body;

    const notification = notificationsService.createNotification(
      titleEN,
      titleAR,
      bodyEN,
      bodyAR
    );

    res.status(httpStatus.OK).json(notification);

    await usersService.sendNotificationToUsers(userIds, notification);
  } catch (err) {
    next(err);
  }
};

module.exports.updateAllDriversProfitRate = async (req, res, next) => {
  try {
    const { profitRate } = req.body;

    await usersService.updateAllDriversProfitRate(profitRate);

    const response = success.user.profitRateUpdatedForAllDrivers;

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.updateDriverProfitRate = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { profitRate } = req.body;

    const updatedDriver = await usersService.updateDriverProfitRate(
      driverId,
      profitRate
    );

    const response = _.pick(updatedDriver, clientSchema);

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.assignAsAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    const { userId } = req.params;
    const result = await usersService.assignAsAdmin(user, userId);

    res.status(httpStatus.OK).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports.blockUser = async (req, res, next) => {
  try {
    const user = req.user;
    const { userId } = req.params;

    const result = await usersService.blockUser(user, userId);

    res.status(httpStatus.OK).json(result);
  } catch (err) {
    next(err);
  }
};
module.exports.findUserByUserName = async (req, res, next) => {
  try {
    const user = req.user;
    const { userName } = req.query;

    const result = await usersService.findUserByUserName(user, userName);

    res.status(httpStatus.OK).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports.getDriversStats = async (req, res, next) => {
  try {
    const driversStats = await usersService.getDriversStats();

    const noOfTrips = await tripsService.getTripsStats();

    const response = {
      ...driversStats,
      ...noOfTrips,
    };

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.getAllDrivers = async (req, res, next) => {
  try {
    const { driverStatus, page = 1, limit = 20 } = req.query;

    const inverifiedDrivers = await usersService.getAllDrivers(
      driverStatus,
      page,
      limit
    );

    const response = {
      inverifiedDrivers: inverifiedDrivers.map((driver) =>
        _.pick(driver, clientSchema)
      ),
    };

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.getAllPassengers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const passengers = await usersService.getAllPassengers(page, limit);

    const response = {
      passengers: passengers.map((passenger) =>
        _.pick(passenger, clientSchema)
      ),
    };

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.getAllTrips = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const trips = await tripsService.getAllTrips(page, limit);

    const response = {
      trips: trips.map((trip) => _.pick(trip, clientSchema)),
    };

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.addDriver = async (req, res, next) => {
  try {
    const {
      // personal info
      email,
      phoneICC,
      phoneNSN,
      firstName,
      lastName,
      gender,
      // car info
      carType,
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

    const { driver } = await usersService.addDriver(
      email,
      phoneICC,
      phoneNSN,
      firstName,
      lastName,
      gender,
      carType,
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

    const response = success.user.driverAdded;

    res.status(httpStatus.CREATED).json(response);

    // Register challenges for the user
    await challengesService.addChallengesProgressToUser(driver);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.acceptDriver = async (req, res, next) => {
  try {
    const { driverId } = req.body;
    const result = await usersService.acceptDriver(driverId);

    res.status(httpStatus.ACCEPTED).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports.rejectDriver = async (req, res, next) => {
  try {
    const { driverId } = req.body;

    const result = await usersService.rejectDriver(driverId);

    res.status(httpStatus.OK).json(result);
  } catch (error) {
    next(error);
  }
};

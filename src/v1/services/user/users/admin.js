const { User } = require("../../../models/user/user");
const httpStatus = require("http-status");
const { ApiError } = require("../../../middleware/apiError");
const errors = require("../../../config/errors");
const innerUserServices = require("./inner");
const carsServices = require("../cars");
const { getIO } = require("../../../setup/socket");

module.exports.findUserByEmailOrPhone = async (
  emailOrPhone,
  role = "",
  withError = false
) => {
  try {
    // Filter `emailOrPhone` param
    const emailOrPhoneIsEmail = emailOrPhone.includes("@");
    const queryCriteria = emailOrPhoneIsEmail
      ? { email: { $eq: emailOrPhone } }
      : { "phone.full": { $eq: "+" + emailOrPhone } };

    // Find user by email or phone
    const user = await User.findOne(queryCriteria);

    // Throwing error if no user found and `throwError = true`
    if (withError && !user) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.user.userNotFound;
      throw new ApiError(statusCode, message);
    }

    // Throwing error if a user was found but the specified `role` does not match
    // This happens in case of role is added as an argument
    // If role is falsy that means this search does not care of role
    if (withError && user && role && user.getRole() !== role) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.user.foundWithInvalidRole;
      throw new ApiError(statusCode, message);
    }

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.updateAllDriversProfitRate = async (profitRate) => {
  try {
    await User.updateMany(
      { role: "driver" },
      { $set: { driverStatus: { profitRate } } }
    );

    return true;
  } catch (err) {
    throw err;
  }
};

module.exports.updateDriverProfitRate = async (driverId, profitRate) => {
  try {
    // Check if driver exists
    const driver = await User.findById(driverId);
    if (!driver || !driver.isDriver()) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.user.driverNotFound;
      throw new ApiError(statusCode, message);
    }

    // Update driver's profit rate
    driver.updateProfitRate(profitRate);

    // Save driver to the DB
    await driver.save();

    return driver;
  } catch (err) {
    throw err;
  }
};

module.exports.blockUser = async (admin, userId) => {
  try {
    if (admin.role !== "admin") {
      const error = errors.user.invalidRole;
      const status = httpStatus.FORBIDDEN;
      throw new ApiError(status, error);
    }

    const user = await User.findOne({ _id: userId });
    if (user.role === "admin") {
      throw new ApiError(httpStatus.FORBIDDEN, errors.user.invalidRole);
    }
    user.blocked = !user.blocked;
    await user.save();

    getIO().to(user._id.toString()).emit("bannded");

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.findUserByUserName = async (admin, userName) => {
  try {
    if (admin.role !== "admin") {
      const error = errors.user.invalidRole;
      const status = httpStatus.FORBIDDEN;
      throw new ApiError(status, error);
    }

    let user;
    if (userName.startsWith("218")) {
      user = await User.findOne({ "phone.full": "+" + userName });
    } else {
      user = await User.findOne({ email: userName });
    }

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, errors.user.noUsers);
    }

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.assignAsAdmin = async (user, userId) => {
  try {
    if (user.role !== "admin") {
      const error = errors.user.invalidRole;
      const status = httpStatus.FORBIDDEN;
      throw new ApiError(status, error);
    }

    const result = await User.updateOne(
      { _id: userId },
      { $set: { role: "admin" } }
    );

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports.getDriversStats = async () => {
  try {
    const pendingDriversNo = await User.countDocuments({
      role: "driver",
      "verified.driver": false,
    });

    const activeDriversNo = await User.countDocuments({
      role: "driver",
      "driverStatus.active": true,
    });

    const verifiedDriversNo = await User.countDocuments({
      role: "driver",
      "verified.driver": true,
    });

    return {
      pendingDriversNo,
      activeDriversNo,
      verifiedDriversNo,
    };
  } catch (err) {
    throw err;
  }
};

module.exports.getAllDrivers = async (filter, page, limit) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);

    switch (filter) {
      case "all":
        return await User.find({ role: "driver" })
          .sort({ _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

      case "pending":
        return await User.find({
          role: "driver",
          "verified.driver": false,
          "driverStatus.rejected": false,
        })
          .sort({ _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

      case "rejected":
        return await User.find({
          role: "driver",
          "verified.driver": false,
          "driverStatus.rejected": true,
        })
          .sort({ _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

      default:
        return [];
    }
  } catch (err) {
    throw err;
  }
};

module.exports.getAllPassengers = async (page, limit) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);

    return await User.find({ role: "passenger" })
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  } catch (err) {
    throw err;
  }
};

module.exports.addDriver = async (
  email,
  phoneICC,
  phoneNSN,
  firstName,
  lastName,
  gender,
  type,
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
) => {
  try {
    const referralCode = await innerUserServices.genUniqueReferralCode();

    const driver = new User({
      firstName,
      lastName,
      email,
      role: "driver",
      gender,
      referral: {
        code: referralCode,
        number: 0,
      },
      phone: {
        full: `${phoneICC}${phoneNSN}`,
        icc: phoneICC,
        nsn: phoneNSN,
      },
      deviceToken: "123456",
    });

    // Save driver to the DB
    await driver.save();

    const car = await carsServices.addCarToDriver(
      driver,
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
      type
    );

    return { driver, car };
  } catch (err) {
    if (err.code === errors.codes.duplicateIndexKey) {
      const statusCode = httpStatus.FORBIDDEN;
      const message = errors.auth.phoneUsed;
      throw new ApiError(statusCode, message);
    }

    throw err;
  }
};

module.exports.acceptDriver = async (driverId) => {
  try {
    const driver = await User.updateOne(
      { _id: driverId },
      { "verified.driver": true, "driverStatus.rejected": false }
    );

    const emit = getIO().to(driverId.toString()).emit("verified");

    return driver;
  } catch (error) {
    throw error;
  }
};

module.exports.rejectDriver = async (driverId) => {
  try {
    const driver = await User.updateOne(
      { _id: driverId },
      { "driverStatus.rejected": true }
    );

    const message = {
      en: "your request has been rejected",
      ar: "تم رفض طلبك",
    };

    const emit = getIO().to(driverId).emit("rejected", message);

    return driver;
  } catch (error) {
    throw error;
  }
};

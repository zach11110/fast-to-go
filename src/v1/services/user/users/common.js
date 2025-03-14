const { User } = require("../../../models/user/user");
const httpStatus = require("http-status");
const localStorage = require("../../storage/local");
const cloudStorage = require("../../cloud/storage");
const { ApiError } = require("../../../middleware/apiError");
const errors = require("../../../config/errors");
const innerServices = require("./inner");
const phoneService = require("../../cloud/phone/index");

var fs = require("fs");
var util = require("util");
const { next } = require("../../../middleware/validation/common");
var log_file = fs.createWriteStream(__dirname + "/debug.log", { flags: "w" });
var log_stdout = process.stdout;

console.log = function (d) {
  //
  log_file.write(util.format(d) + "\n");
  log_stdout.write(util.format(d) + "\n");
};

module.exports.authenticateUser = async (user, lang, deviceToken) => {
  try {
    // [OPTIONAL]: Update user's favorite language
    user.updateLanguage(lang);

    // [OPTIONAL]: Update user's device token
    user.updateDeviceToken(deviceToken);

    // Update user's last login date
    user.updateLastLogin();

    // Save user to the DB
    await user.save();

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.resendEmailOrPhoneVerificationCode = async (key, user) => {
  try {
    // Ensure that key is correct
    key = key.toLowerCase();
    if (!["email", "phone"].includes(key)) {
      key = "email";
    }

    // Check if user's email or phone is verified
    const isVerified =
      key === "email" ? user.isEmailVerified() : user.isPhoneVerified();
    if (isVerified) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.user[`${key}AlreadyVerified`];
      throw new ApiError(statusCode, message);
    }

    // Update user's email or phone verification code
    user.updateCode(key);

    if (key === "phone") {
      // Unverify phone number.
      user.unverifyPhone();
    }

    // Save user to the DB
    await user.save();

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.sendOTP = async (number) => {
  try {
    const user = await User.findOne({ "phone.nsn": number });

    if (!user) {
      const error = new Error("No such user exists");
      error.statusCode = 404;
      throw error;
    }

    const otpCode = user.updateCode("phone");

    // send OTP
    await phoneService.sendOTP(user.phone.nsn, otpCode);

    return { user, otpCode };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

module.exports.verifyPhoneNumber = async (user, otpCode) => {
  try {
    // Check if user's phone is verified
    const isVerified = user.isPhoneVerified();
    if (isVerified) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.user.phoneAlreadyVerified;
      throw new ApiError(statusCode, message);
    }

    // Check if code is correct
    const isCorrectCode = user.isMatchingCode("phone", otpCode);
    if (!isCorrectCode) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.auth.incorrectCode;
      throw new ApiError(statusCode, message);
    }

    // Check if code is expired
    const isValidCode = user.isValidCode("phone");
    if (!isValidCode) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.auth.expiredCode;
      throw new ApiError(statusCode, message);
    }

    // Verify user's phone
    await User.updateOne(
      { _id: user._id },
      {
        "verified.phone": true,
        "verification.phone.code": "",
        "verification.phone.expiryDate": "",
      }
    );

    // Return user after updating
    return User.findOne({ _id: user._id });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports.verifyEmailOrPhone = async (key, user, code) => {
  try {
    // Ensure that key is correct
    key = key.toLowerCase();
    if (!["email", "phone"].includes(key)) {
      key = "email";
    }

    // Check if user's email or phone is verified
    const isVerified =
      key === "email" ? user.isEmailVerified() : user.isPhoneVerified();
    if (isVerified) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.user[`${key}AlreadyVerified`];
      throw new ApiError(statusCode, message);
    }

    // Check if code is correct
    const isCorrectCode = user.isMatchingCode(key, code);

    if (!isCorrectCode) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.auth.incorrectCode;
      throw new ApiError(statusCode, message);
    }

    // Check if code is expired
    const isValidCode = user.isValidCode(key);
    if (!isValidCode) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.auth.expiredCode;
      throw new ApiError(statusCode, message);
    }

    // Verify user's email or phone
    if (key === "email") {
      user.verifyEmail();
    } else {
      user.verifyPhone();
    }

    // Save user to the DB
    await user.save();

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.verifyEmailByLink = async (token, code) => {
  try {
    const payload = innerServices.validateToken(token);

    // Check if user exists
    const user = await User.findById(payload.sub);
    if (!user) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.user.userNotFound;
      throw new ApiError(statusCode, message);
    }

    // Check if user's email is already verified
    if (user.isEmailVerified()) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.user.emailAlreadyVerified;
      throw new ApiError(statusCode, message);
    }

    // Check if code is correct
    const isCorrectCode = user.isMatchingCode("email", code);
    if (!isCorrectCode) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.auth.incorrectCode;
      throw new ApiError(statusCode, message);
    }

    // Check if code is expired
    const isValidCode = user.isValidCode("email");
    if (!isValidCode) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.auth.expiredCode;
      throw new ApiError(statusCode, message);
    }

    // Verify user's email
    user.verifyEmail();

    // Save user to the DB
    await user.save();

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.updateProfile = async (
  user,
  firstName,
  lastName,
  email,
  phoneNSN,
  gender
) => {
  try {
    return await updateUserProfile(
      user,
      firstName,
      lastName,
      email,
      phoneNSN,
      gender
    );
  } catch (err) {
    throw err;
  }
};

module.exports.updateAvatar = async (user, avatar) => {
  try {
    // Check if user has an avatar that's stored on the bucket
    if (user.getAvatarURL() && !user.hasGoogleAvatar()) {
      user.clearAvatarURL();
    }

    // Store file locally in the `uploads` folder
    const localPhoto = await localStorage.storeFile(avatar);

    // Upload file from `uploads` folder to cloud bucket
    const cloudPhotoURL = await cloudStorage.uploadFile(localPhoto);

    // Delete previous avatar picture from cloud bucket
    await cloudStorage.deleteFile(user.getAvatarURL());

    // Update user's avatar URL
    user.updateAvatarURL(cloudPhotoURL);

    // Save user to the DB
    await user.save();
    await localStorage.deleteFile(localPhoto.path);
    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.updateLocation = async (user, location) => {
  try {
    user.updateLocation(location);

    newUser = await user.save();

    return user;
  } catch (error) {
    throw error;
  }
};

module.exports.setDeviceToken = async (user, token) => {
  try {
    user.updateDeviceToken(token);
    await user.save();

    return token;
  } catch (error) {
    throw error;
  }
};

module.exports.switchLanguage = async (user) => {
  try {
    // Switch user's language
    user.switchLanguage();

    // Save user to the DB
    await user.save();

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.seeNotifications = async (user) => {
  try {
    // Check all user's notifications
    const { isAllSeen, list } = user.seeNotifications();

    // Throw an error in case of all user's notifications
    // are already seen
    if (isAllSeen) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.user.notificationsSeen;
      throw new ApiError(statusCode, message);
    }

    // Save the user
    await user.save();

    // Return user's notifications
    return list;
  } catch (err) {
    throw err;
  }
};

module.exports.clearNotifications = async (user) => {
  try {
    // Clear notifications
    const isEmpty = user.clearNotifications();

    // Check if notifications are empty
    if (isEmpty) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.user.noNotifications;
      throw new ApiError(statusCode, message);
    }

    // Save the user
    await user.save();

    // Return user's notifications
    return user.notifications;
  } catch (err) {
    throw err;
  }
};

module.exports.toggleNotifications = async (user) => {
  try {
    // Disable notifications for user
    user.toggleNotifications();

    // Save the user
    await user.save();

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.enableNotifications = async (user) => {
  try {
    // Disable notifications for user
    user.enableNotifications();

    // Save the user
    await user.save();

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.requestAccountDeletion = async (user) => {
  try {
    // Update user's account deletion code
    user.updateCode("deletion");

    // Save the user
    await user.save();

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.confirmAccountDeletion = async (token, code) => {
  try {
    const payload = innerServices.validateToken(token);

    // Check if user exists
    const user = await User.findById(payload.sub);
    if (!user || user.isDeleted()) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.user.userNotFound;
      throw new ApiError(statusCode, message);
    }

    // Check if code is correct
    const isCorrectCode = user.isMatchingCode("deletion", code);
    if (!isCorrectCode) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.auth.incorrectCode;
      throw new ApiError(statusCode, message);
    }

    // Check if code is expired
    const isValidCode = user.isValidCode("deletion");
    if (!isValidCode) {
      const statusCode = httpStatus.BAD_REQUEST;
      const message = errors.auth.expiredCode;
      throw new ApiError(statusCode, message);
    }

    // Mark user as deleted
    user.markAsDeleted();

    // Save user to the DB
    await user.save();

    return user;
  } catch (err) {
    throw err;
  }
};

module.exports.getSavedPlaces = async (user) => {
  try {
    return user.getSavedPlaces();
  } catch (error) {
    throw error;
  }
};

module.exports.savePlace = async (user, title, type, longitude, latitude) => {
  try {
    // Add place to user's saved places list
    user.savePlace(title, type, longitude, latitude);

    // Save user to the DB
    await user.save();

    return user.getSavedPlaces();
  } catch (err) {
    throw err;
  }
};

module.exports.updateSavedPlace = async (
  user,
  placeId,
  title,
  type,
  longitude,
  latitude
) => {
  try {
    const { found, updated } = user.updatePlace(
      placeId,
      title,
      type,
      longitude,
      latitude
    );

    if (!found) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.user.placeNotFound;
      throw new ApiError(statusCode, message);
    }

    if (!updated) {
      const statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      const message = errors.user.placeNotUpdated;
      throw new ApiError(statusCode, message);
    }

    await user.save();

    return user.getSavedPlaces();
  } catch (err) {
    throw err;
  }
};

module.exports.deleteSavedPlace = async (user, placeId) => {
  try {
    user.deletePlace(placeId);

    await user.save();

    return user.getSavedPlaces();
  } catch (err) {
    throw err;
  }
};

module.exports.addEvaluation = async (evaluation, { driverId }) => {
  try {
    const driver = await User.findOne({ _id: driverId });

    if (!driver) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.user.noDrivers;
      throw new ApiError(statusCode, message);
    }

    driver.addEvaluation(evaluation);
    await driver.save();

    return driver;
  } catch (error) {
    throw error;
  }
};

const updateUserProfile = async (
  user,
  firstName,
  lastName,
  email,
  phoneNSN,
  gender
) => {
  try {
    const updates = [];

    if (firstName && user.getFirstName() !== firstName) {
      user.updateFirstName(firstName);
      updates.push("firstName");
    }

    if (lastName && user.getLastName() !== lastName) {
      user.updateLastName(lastName);
      updates.push("lastName");
    }

    if (email && user.getEmail() !== email) {
      const userWithThisEmail = await User.findOne({
        email: email,
      });

      if (userWithThisEmail) {
        const statusCode = httpStatus.FORBIDDEN;
        const message = errors.auth.emailUsed;
        throw new ApiError(statusCode, message);
      }

      user.updateEmail(email);
      updates.push("email");
    }

    if (phoneNSN && user.getPhoneNSN() !== phoneNSN) {
      const userWithThisPhone = await User.findOne({
        "phone.full": `+218${phoneNSN}`,
      });
      if (userWithThisPhone) {
        const statusCode = httpStatus.FORBIDDEN;
        const message = errors.auth.phoneUsed;
        throw new ApiError(statusCode, message);
      }

      user.updatePhoneNSN(phoneNSN);
      updates.push("phoneNSN");
    }

    if (gender && user.getGender() !== gender) {
      user.updateGender(gender);
      updates.push("gender");
    }

    if (updates.length) {
      await user.save();
    }

    return user;
  } catch (err) {
    throw err;
  }
};

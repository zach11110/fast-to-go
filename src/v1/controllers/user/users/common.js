const httpStatus = require("http-status");
const _ = require("lodash");
const { clientSchema } = require("../../../models/user/user");
const { usersService, emailService } = require("../../../services");
const success = require("../../../config/success");
const { getIO } = require("../../../setup/socket");
const { demos } = require("../../../config/models");
const phoneService = require("../../../services/cloud/phone/index");

var fs = require("fs");
var util = require("util");
const { log } = require("console");
const { next } = require("../../../middleware/validation/common");
var log_file = fs.createWriteStream(__dirname + "/debug.log", { flags: "w" });
var log_stdout = process.stdout;

console.log = function (d) {
  //
  log_file.write(util.format(d) + "\n");
  log_stdout.write(util.format(d) + "\n");
};

module.exports.authenticateUser = async (req, res, next) => {
  try {
    const user = req.user;
    const { lang, deviceToken } = req.query;

    const newUser = await usersService.authenticateUser(
      user,
      lang,
      deviceToken
    );

    // Create the response object
    const response = _.pick(newUser, clientSchema);

    // Send response back to the client
    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.joinUserToSocket = async (req, res, next) => {
  try {
    const user = req.user;
    const { socketId } = req.query;

    // Connect user's socket to their own room
    usersService.joinSocketToUserRoom(socketId, user._id);

    // Create the response object
    const response = success.auth.joinedSocket;

    // Send response back to the client
    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.getUserByPhoneNumber = async (req, res, next) => {
  try {
    const { number } = req.body;
    const user = await usersService.getUserByPhoneNumber(number);

    if (user) {
      if (!demos.some((el) => el == user.phone.nsn)) {
        user.verified.phone = false;
        user.deviceToken = 123456;
        await user.save();
      }
      const response = {
        user,
        token: user.genAuthToken(),
      };
      return res.status(httpStatus.OK).json(response);
    }

    return res.status(httpStatus.OK).json({ message: "Not found", user: null });
  } catch (err) {
    next(err);
  }
};

module.exports.isUserExists = async (req, res, next) => {
  try {
    const { number } = req.query;

    const user = await usersService.getUserByPhoneNumber(number);

    let response = { exist: false };

    if (user) {
      response = { exist: true };
    }

    return res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { firstName, lastName, email, phoneNSN, gender } = req.body;

    const updatedUser = await usersService.updateProfile(
      user,
      firstName,
      lastName,
      email,
      phoneNSN,
      gender
    );

    // Create the response object
    const response = {
      user: _.pick(updatedUser, clientSchema),
      token: updatedUser.genAuthToken(),
    };

    // Send response back to the client
    res.status(httpStatus.CREATED).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.updateAvatar = async (req, res, next) => {
  try {
    const user = req.user;
    const avatar = req?.body?.avatar;

    // Asking service to update user's avatar picture
    const newUser = await usersService.updateAvatar(user, avatar);

    // Create the response object
    const response = _.pick(newUser, clientSchema);

    // Send response back to the client
    res.status(httpStatus.CREATED).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.updateLocation = async (req, res, next) => {
  try {
    const user = req.user;

    const { latitude, longitude } = req.body;

    const location = { latitude, longitude };

    let updatedUser = user;

    updatedUser = await usersService.updateLocation(user, location);

    const response = _.pick(updatedUser, clientSchema);

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
};
module.exports.setDeviceToken = async (req, res, next) => {
  try {
    const user = req.user;
    const { newToken } = req.body;

    console.log(newToken);

    const token = await usersService.setDeviceToken(user, newToken);

    res.status(httpStatus.OK).json({ Token: token });
  } catch (error) {
    next(error);
  }
};

module.exports.switchLanguage = async (req, res, next) => {
  try {
    const user = req.user;

    const updatedUser = await usersService.switchLanguage(user);

    const response = _.pick(updatedUser, clientSchema);

    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.verifyPhone = async (req, res, next) => {
  try {
    const { user } = req;

    const { code } = req.body;

    const verifiededUser = await usersService.verifyPhoneNumber(user, code);

    const response = _.pick(verifiededUser, clientSchema);

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports.seeNotifications = async (req, res, next) => {
  try {
    const user = req.user;

    // Asking service to mark all user's notifications as seen
    const notifications = await usersService.seeNotifications(user);

    // Create the response object
    const response = {
      notifications,
    };

    // Send response back to the client
    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.clearNotifications = async (req, res, next) => {
  try {
    const user = req.user;

    // Asking service to delete all user's notifications
    const notifications = await usersService.clearNotifications(user);

    // Create the response object
    const response = {
      notifications,
    };

    // Send response back to the client
    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.toggleNotifications = async (req, res, next) => {
  try {
    const user = req.user;

    // Asking service to disable notifications for user
    const updatedUser = await usersService.toggleNotifications(user);

    // Create the response object
    const response = _.pick(updatedUser, clientSchema);

    // Send response back to the client
    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.enableNotifications = async (req, res, next) => {
  try {
    const user = req.user;

    // Asking service to enable notifications for user
    const updatedUser = await usersService.enableNotifications(user);

    // Create the response object
    const response = _.pick(updatedUser, clientSchema);

    // Send response back to the client
    res.status(httpStatus.OK).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.requestAccountDeletion = async (req, res, next) => {
  try {
    const user = req.user;

    // Asking service to delete all user's notifications
    const newUser = await usersService.requestAccountDeletion(user);

    // Create the response object
    const response = success.auth.accountDeletionCodeSent;

    // Send response back to the client
    res.status(httpStatus.OK).json(response);

    // Construct deletion link
    const host = req.get("host");
    const protocol =
      host.split(":")[0] === "localhost" ? "http://" : "https://";
    const endpoint = "/api/users/account/deletion/confirm";
    const code = newUser.getCode("deletion");
    const token = newUser.genAuthToken();
    const deletionLink = `${protocol}${host}${endpoint}?code=${code}&token=${token}`;

    // Send email to user
    await emailService.sendAccountDeletionCodeEmail(
      newUser.getLanguage(),
      newUser.getEmail(),
      newUser.getFullName(),
      deletionLink
    );
  } catch (err) {
    next(err);
  }
};

module.exports.confirmAccountDeletion = async (req, res, next) => {
  try {
    const { token, code } = req.query;

    // Delete user and their data
    const user = await usersService.confirmAccountDeletion(token, code);

    // Create the response object
    const response = success.auth.accountDeleted[user.getLanguage()];

    // Send response back to the client
    res.status(httpStatus.OK).send(response);

    getIO().to(user._id.toString()).emit("account deleted", null);

    // Send an email to the user
    await emailService.sendAccountDeletedEmail(
      user.getLanguage(),
      user.getEmail(),
      user.getFullName()
    );
  } catch (err) {
    next(err);
  }
};

module.exports.resendEmailOrPhoneVerificationCode =
  (key) => async (req, res, next) => {
    try {
      const user = req.user;
      const { lang } = req.query;

      // Asking service to send user's email/phone verification code
      const newUser = await usersService.resendEmailOrPhoneVerificationCode(
        key,
        user,
        lang
      );

      // Create the response object
      const response = {
        ok: true,
        message:
          key === "email"
            ? success.auth.emailVerificationCodeSent
            : success.auth.phoneVerificationCodeSent,
      };

      // Send response back to the client
      res.status(httpStatus.OK).json(response);

      // Sending email or phone verification code to user's email or phone
      if (key === "email") {
        // Construct verification email
        const host = req.get("host");
        const protocol =
          host.split(":")[0] === "localhost" ? "http://" : "https://";
        const endpoint = "/api/users/email/verify/fast";
        const code = newUser.getCode("email");
        const token = newUser.genAuthToken();
        const verificationLink = `${protocol}${host}${endpoint}?code=${code}&token=${token}`;

        await emailService.sendVerificationCodeEmail(
          newUser.getLanguage(),
          newUser.getEmail(),
          code,
          newUser.getFullName(),
          verificationLink
        );
      } else {
        // Send OTP
        await phoneService.sendOTP(
          newUser.phone.nsn,
          newUser.verification.phone.code
        );
      }
    } catch (err) {
      next(err);
    }
  };

module.exports.sendOTP = async (req, res, next) => {
  try {
    const { number } = req.query;

    const { user, otpCode } = await usersService.sendOTP(number);

    console.log(otpCode);

    await user.save();

    res.status(httpStatus.OK).json({
      message: "OTP Code is sent successfully!",
    });
  } catch (err) {
    next(err);
  }
};

module.exports.verifyEmailOrPhone = (key) => async (req, res, next) => {
  try {
    const user = req.user;
    const { code } = req.body;

    // Asking service to verify user's email or phone
    const verifiedUser = await usersService.verifyEmailOrPhone(key, user, code);

    // Create the response object
    const response = _.pick(verifiedUser, clientSchema);

    // Send response back to the client
    res.status(httpStatus.OK).json(response);

    // Notify user that proccess is accomplished successfully
    // and send a message to user's email or phone
    if (key === "email") {
      await emailService.sendEmailVerifiedEmail(
        user.getLanguage(),
        user.getEmail(),
        user.getFullName()
      );
    } else {
      // TODO: send an SMS message to user's phone
      await phoneService.sendOTP(user.phone.nsn, OTPcode);
    }
  } catch (err) {
    next(err);
  }
};

module.exports.verifyEmailByLink = async (req, res, next) => {
  try {
    const { token, code } = req.query;

    const user = await usersService.verifyEmailByLink(token, code);

    // Create the response object
    const response = success.auth.emailVerified[user.getLanguage()];

    // Send response back to the client
    res.status(httpStatus.OK).send(response);

    // Send email to user
    await emailService.sendEmailVerifiedEmail(
      user.getLanguage(),
      user.getEmail(),
      user.getFullName()
    );
  } catch (err) {
    next(err);
  }
};

module.exports.getSavedPlaces = async (req, res, next) => {
  try {
    const user = req.user;
    const response = await usersService.getSavedPlaces(user);

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports.savePlace = async (req, res, next) => {
  try {
    const user = req.user;
    const { title, type, longitude, latitude } = req.body;

    const savedPlaces = await usersService.savePlace(
      user,
      title,
      type,
      longitude,
      latitude
    );

    const response = {
      savedPlaces,
    };

    res.status(httpStatus.CREATED).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.updateSavedPlace = async (req, res, next) => {
  try {
    const user = req.user;
    const { placeId } = req.params;
    const { title, type, longitude, latitude } = req.body;

    const savedPlaces = await usersService.updateSavedPlace(
      user,
      placeId,
      title,
      type,
      longitude,
      latitude
    );

    const response = { savedPlaces };

    res.status(httpStatus.CREATED).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.deleteSavedPlace = async (req, res, next) => {
  try {
    const user = req.user;
    const { placeId } = req.params;

    const savedPlaces = await usersService.deleteSavedPlace(user, placeId);

    const response = { savedPlaces };

    res.status(httpStatus.CREATED).json(response);
  } catch (err) {
    next(err);
  }
};

module.exports.addEvaluation = async (req, res, next) => {
  try {
    const user = req.user;

    const driverId = req.params;
    const { evaluation } = req.body;

    const added = await usersService.addEvaluation(evaluation, driverId);

    res.status(httpStatus.OK).json(added);
  } catch (error) {
    next(error);
  }
};

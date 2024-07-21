const {
  authService,
  emailService,
  usersService,
  challengesService,
} = require("../../../services");
const httpStatus = require("http-status");
const { clientSchema } = require("../../../models/user/user");
const _ = require("lodash");
const success = require("../../../config/success/index");

module.exports.joinWithEmailAndPhone = async (req, res, next) => {
  try {
    const {
      lang,
      email,
      phoneICC,
      phoneNSN,
      firstName,
      lastName,
      gender,
      role,
      referralCode,
      deviceToken,
    } = req.body;

    // Find user with provided credentials
    const { user, isDeleted } = await authService.joinWithEmailAndPhone(
      email,
      phoneICC,
      phoneNSN,
      firstName,
      lastName,
      role,
      gender,
      deviceToken,
      lang
    );

    // Create the response object
    const response = {
      user: _.pick(user, clientSchema),
      // message: success.auth.phoneVerificationCodeSent,
      token: user.genAuthToken(),
    };

    // Send response back to the client
    res.status(httpStatus.OK).json(response);

    // Register challenges for the user
    await challengesService.addChallengesProgressToUser(user);

    if (isDeleted) {
      // Send welcome back email to user
      await emailService.sendWelcomeBackEmail(
        user.getLanguage(),
        user.getEmail(),
        user.getFullName()
      );
    }

    // Apply referral code
    const referralCodeOwner = await usersService.applyReferralCode(
      user,
      referralCode
    );

    if (referralCodeOwner) {
      await challengesService.addReferralProgressPointToUser(referralCodeOwner);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.joinWithPhone = async (req, res, next) => {
  try {
    const { phoneICC, phoneNSN } = req.body;

    // Find user with provided credentials
    const { user, isDeleted } = await authService.joinWithPhone(
      phoneICC,
      phoneNSN
    );

    // Create the response object
    const response = {
      user: _.pick(user, clientSchema),
      // message: success.auth.phoneVerificationCodeSent,
      token: user.genAuthToken(),
    };

    // Send response back to the client
    res.status(httpStatus.OK).json(response);

    // Register challenges for the user
    await challengesService.addChallengesProgressToUser(user);

    if (isDeleted) {
      // Send welcome back email to user
      await emailService.sendWelcomeBackEmail(
        user.getLanguage(),
        user.getEmail(),
        user.getFullName()
      );
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

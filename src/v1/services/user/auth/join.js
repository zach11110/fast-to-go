const axios = require("axios");
const { User } = require("../../../models/user/user");
const { ApiError } = require("../../../middleware/apiError");
const httpStatus = require("http-status");
const errors = require("../../../config/errors");
const usersService = require("../users");
const phoneService = require("../../cloud/phone/index");

module.exports.joinWithEmailAndPhone = async (
  email,
  phoneICC,
  phoneNSN,
  firstName,
  lastName,
  role,
  gender,
  deviceToken,
  lang
) => {
  try {
    let isDeleted = false;

    // Construct full phone
    const fullPhone = `${phoneICC}${phoneNSN}`;

    // Check if user exists
    let user = await User.findOne({ "phone.full": fullPhone });

    if (user) {
      isDeleted = user.isDeleted();

      if (isDeleted) {
        user.restoreAccount();
      }
    } else {
      // Generate a referral code for the new user
      const referralCode = await usersService.genUniqueReferralCode();

      user = new User({
        // Create new user
        firstName,
        lastName,
        email,
        role,
        gender,
        referral: {
          code: referralCode,
          number: 0,
        },
        phone: {
          full: fullPhone,
          icc: phoneICC,
          nsn: phoneNSN,
        },
      });
    }

    // Generate OTP code and update it for the user
    const otpCode = user.updateCode("phone");
    console.log(otpCode);

    // Send OTP
    await phoneService.sendOTP(user.phone.nsn, otpCode);

    // Update user's device token
    // user.updateDeviceToken(deviceToken);

    user.deviceToken = 123456;

    // Update user's favorite language
    user.updateLanguage(lang);

    // Update user's last login date
    user.updateLastLogin();

    // Save user to the DB
    await user.save();
    return {
      user,
      isDeleted,
    };
  } catch (err) {
    console.log(err);
    if (err.code === errors.codes.duplicateIndexKey) {
      const statusCode = httpStatus.FORBIDDEN;
      const message = errors.auth.emailOrPhoneUsed;
      throw new ApiError(statusCode, message);
    }

    throw err;
  }
};

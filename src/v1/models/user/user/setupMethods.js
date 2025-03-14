const jwt = require("jsonwebtoken");
const { user: config } = require("../../../config/models");

const verification = {
  email: {
    expiryInMins: 10,
    codeLength: config.verificationCode.exactLength,
  },
  phone: {
    expiryInMins: 10,
    codeLength: config.verificationCode.exactLength,
  },
  deletion: {
    expiryInMins: 10,
    codeLength: config.verificationCode.exactLength,
  },
};

module.exports = (mongodbSchema) => {
  //////////////////// AUTH TYPE ////////////////////
  mongodbSchema.methods.getAuthType = function () {
    return this.authType;
  };

  //////////////////// AVATAR ////////////////////
  mongodbSchema.methods.hasGoogleAvatar = function () {
    return this.avatarURL.includes("googleusercontent.com");
  };

  mongodbSchema.methods.clearAvatarURL = function () {
    this.avatarURL = "";
  };

  mongodbSchema.methods.updateAvatarURL = function (avatarURL) {
    this.avatarURL = avatarURL || "";
  };

  mongodbSchema.methods.updateLocation = function (location) {
    this.location = location;
  };

  mongodbSchema.methods.getAvatarURL = function () {
    return this.avatarURL;
  };

  //////////////////////// NAME ////////////////////////
  mongodbSchema.methods.updateFirstName = function (firstName) {
    this.firstName = firstName;
  };

  mongodbSchema.methods.updateLastName = function (lastName) {
    this.lastName = lastName;
  };

  mongodbSchema.methods.getFirstName = function () {
    return this.firstName;
  };

  mongodbSchema.methods.getLastName = function () {
    return this.lastName;
  };

  mongodbSchema.methods.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
  };

  mongodbSchema.methods.compareFirstName = function (firstName) {
    return this.firstName === firstName;
  };

  mongodbSchema.methods.compareLastName = function (lastName) {
    return this.lastName === lastName;
  };

  mongodbSchema.methods.compareFullName = function (name) {
    return `${this.firstName} ${this.lastName}` === name;
  };

  //////////////////////// EMAIL ////////////////////////
  mongodbSchema.methods.isEmailVerified = function () {
    return this.verified.email;
  };

  mongodbSchema.methods.verifyEmail = function () {
    this.verified.email = true;
  };

  mongodbSchema.methods.unverifyEmail = function () {
    this.verified.email = false;
  };

  mongodbSchema.methods.updateEmail = function (email) {
    this.email = email;
  };

  mongodbSchema.methods.getEmail = function () {
    return this.email;
  };

  //////////////////////// PHONE ////////////////////////
  mongodbSchema.methods.isPhoneVerified = function () {
    return this.verified.phone;
  };

  mongodbSchema.methods.verifyPhone = function () {
    this.verification.phone.code = "";
    this.verification.phone.expiryDate = "";
    return (this.verified.phone = true);
  };

  mongodbSchema.methods.unverifyPhone = function () {
    this.verified.phone = false;
  };

  mongodbSchema.methods.updatePhone = function (icc, nsn) {
    this.phone = {
      full: `${icc}${nsn}`,
      icc,
      nsn,
    };
  };

  mongodbSchema.methods.getPhone = function () {
    return this.phone.full;
  };

  mongodbSchema.methods.getPhoneICC = function () {
    return this.phone.icc;
  };

  mongodbSchema.methods.getPhoneNSN = function () {
    return this.phone.nsn;
  };

  mongodbSchema.methods.updatePhoneNSN = function (phoneNSN) {
    this.phone = {
      full: `${this.phone.icc}${phoneNSN}`,
      icc: this.phone.icc,
      nsn: phoneNSN,
    };
  };

  //////////////////////// DRIVER ////////////////////////

  mongodbSchema.methods.addEvaluation = function ({ text, rate }) {
    if (text) {
      this.driverEvalution.text.push(text);
    }
    this.driverEvalution.rate = this.driverEvalution.rate + rate;
    return this;
  };

  mongodbSchema.methods.isVerifiedDriver = function () {
    return this.verified.driver;
  };

  mongodbSchema.methods.isDriver = function () {
    return this.role === "driver";
  };

  mongodbSchema.methods.verifyDriver = function () {
    this.verified.driver = true;
  };

  mongodbSchema.methods.toggleDriverConnected = function () {
    this.driverStatus.active = !this.driverStatus.active;
  };

  mongodbSchema.methods.setBusy = function (busy) {
    this.driverStatus.busy = busy;
  };

  //////////////////////// ROLE ////////////////////////
  mongodbSchema.methods.getRole = function () {
    return this.role;
  };

  mongodbSchema.methods.isAdmin = function () {
    return this.role === "admin";
  };

  mongodbSchema.methods.updateRole = function (role) {
    this.role = role;
  };

  //////////////////////// LANGUAGE ////////////////////////
  mongodbSchema.methods.switchLanguage = function () {
    this.display.language = this.display.language === "en" ? "ar" : "en";
  };

  mongodbSchema.methods.updateLanguage = function (lang) {
    // Check if `lang` param exists
    if (!lang) {
      return;
    }

    this.display.language = lang;
  };

  mongodbSchema.methods.getLanguage = function () {
    return this.display.language;
  };

  //////////////////////// NOTIFICATIONS ////////////////////////
  mongodbSchema.methods.addNotification = function (notification) {
    const { maxNotificationsCount } = config;

    // Make sure that the max notifications count is considered.
    this.notifications.list = this.notifications.list.slice(
      0,
      maxNotificationsCount
    );

    // If the max count reached then we remove the oldest one.
    while (this.notifications.length >= maxNotificationsCount) {
      this.notifications.list.pop();
    }

    // Add the notification to the beginning of the array
    this.notifications.list.unshift(notification);
  };

  mongodbSchema.methods.seeNotifications = function () {
    // Return `true` if there are no notifications
    // True means no new notifications
    if (!this.notifications.list.length) {
      return true;
    }

    // Declare a variable to track unseen notifications
    let isAllSeen = true;

    // Mark all notification as seen
    this.notifications.list = this.notifications.list.map((n) => {
      isAllSeen = isAllSeen && n.seen;

      return {
        ...n,
        seen: true,
      };
    });
    // Return the result
    return { isAllSeen, list: this.notifications.list };
  };

  mongodbSchema.methods.clearNotifications = function () {
    const isEmpty = !this.notifications.list.length;
    this.notifications.list = [];
    return isEmpty;
  };

  mongodbSchema.methods.amountDeduction = function (amount) {
    this.balance = this.balance - amount;
  };

  mongodbSchema.methods.hasReceivedNotification = function (notification) {
    // Check if user has received this notification
    // and didn't saw it
    const index = this.notifications.list.findIndex(
      (n) =>
        n.title.en === notification.title.en &&
        n.title.ar === notification.title.ar &&
        n.body.en === notification.body.en &&
        n.body.ar === notification.body.ar &&
        !n.seen
    );

    // This means that the current user has received
    // the given notification before, and it hasn't
    // read it.
    return index >= 0;
  };

  mongodbSchema.methods.isNotificationsActive = function () {
    return this.notifications.active;
  };

  mongodbSchema.methods.getNotifications = function () {
    return this.notifications.list;
  };

  mongodbSchema.methods.toggleNotifications = function () {
    this.notifications.active = !this.notifications.active;
  };

  //////////////////////// REFERRAL CODE ////////////////////////
  mongodbSchema.methods.setReferralCode = function (referralCode) {
    this.referral.code = referralCode;
  };

  mongodbSchema.methods.getReferralCode = function () {
    return this.referral.code;
  };

  mongodbSchema.methods.getNoOfReferrals = function () {
    return this.referral.number;
  };

  mongodbSchema.methods.addReferral = function () {
    this.referral.number = this.referral.number + 1;
    this.balance = this.balance + config.rewardAmountForReferral;
  };

  //////////////////////// BALANCE ////////////////////////
  mongodbSchema.methods.getBalance = function () {
    return this.balance;
  };

  mongodbSchema.methods.addBalance = function (amount) {
    this.balance += amount;
  };

  //////////////////////// DEVICE TOKEN ////////////////////////
  mongodbSchema.methods.updateDeviceToken = function (deviceToken) {
    // Check if `deviceToken` param exists
    if (!deviceToken) {
      return;
    }

    // Update user's device token
    this.deviceToken = deviceToken;
  };

  mongodbSchema.methods.getDeviceToken = function () {
    return this.deviceToken;
  };

  //////////////////////// TOKEN ////////////////////////
  mongodbSchema.methods.genAuthToken = function () {
    const body = {
      sub: this._id.toHexString(),
      email: this.email,
      phone: this.phone.full,
    };

    return jwt.sign(body, process.env["JWT_PRIVATE_KEY"]);
  };

  //////////////////////// LAST LOGIN ////////////////////////
  mongodbSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
  };

  mongodbSchema.methods.getLastLogin = function () {
    return this.lastLogin;
  };

  //////////////////////// VERIFICATION CODES ////////////////////////
  mongodbSchema.methods.genCode = function (length = 4) {
    const possibleNums = Math.pow(10, length - 1);
    return Math.floor(possibleNums + Math.random() * 9 * possibleNums);
  };

  mongodbSchema.methods.updateCode = function (key) {
    const { codeLength, expiryInMins } = verification[key];

    // Generate code
    const code = this.genCode(codeLength);

    // Generate expiry date
    // const mins = expiryInMins * 60 * 1000;
    // const expiryDate = new Date() + mins;
    const mins = expiryInMins * 60 * 1000;
    const expiryDate = new Date(Date.now() + mins);

    // Update email verification code
    this.verification[key] = { code, expiryDate };
    return code;
  };

  mongodbSchema.methods.isMatchingCode = function (key, code) {
    return this.verification[key].code == code;
  };

  mongodbSchema.methods.isValidCode = function (key) {
    const { expiryDate } = this.verification[key];
    // Check if the now date is before the expiry date
    return new Date() < expiryDate;
  };

  mongodbSchema.methods.getCode = function (key) {
    return this.verification[key].code;
  };

  //////////////////////// ACCOUNT STATUS ////////////////////////
  mongodbSchema.methods.markAsDeleted = function () {
    this.deleted = true;
  };

  mongodbSchema.methods.isDeleted = function () {
    return this.deleted;
  };

  mongodbSchema.methods.restoreAccount = function () {
    // Mark account as not deleted
    this.deleted = false;

    // Clear account deletion code
    this.verification.deletion = { code: "", expiryDate: null };
  };

  //////////////////////// USER'S TRIPS ////////////////////////
  mongodbSchema.methods.addDriverTrip = function () {
    this.trips.asDriver += 1;
  };

  mongodbSchema.methods.addPassengerTrip = function () {
    this.trips.asPassenger += 1;
  };

  //////////////////////// USER'S SAVED PLACES ////////////////////////
  mongodbSchema.methods.getSavedPlaces = function () {
    return this.savedPlaces;
  };

  mongodbSchema.methods.savePlace = function (
    title,
    type,
    longitude,
    latitude
  ) {
    this.savedPlaces.push({ title, type, longitude, latitude });
  };

  mongodbSchema.methods.updatePlace = function (
    placeId,
    title,
    type,
    longitude,
    latitude
  ) {
    let found = false;
    let updated = false;

    try {
      const index = this.savedPlaces.findIndex(
        (place) => place._id.toString() === placeId.toString()
      );

      found = index >= 0;

      this.savedPlaces[index] = { title, type, longitude, latitude };

      updated = true;

      return { found, updated };
    } catch (err) {
      return { found, updated };
    }
  };

  mongodbSchema.methods.deletePlace = function (placeId) {
    const index = this.savedPlaces.findIndex(
      (place) => place._id.toString() === placeId.toString()
    );

    if (index >= 0) {
      this.savedPlaces.splice(index, 1);
    }
  };

  //////////////////////// USER'S GENDER ////////////////////////
  mongodbSchema.methods.getGender = function () {
    return this.gender;
  };

  mongodbSchema.methods.updateGender = function (gender) {
    this.gender = gender;
  };

  //////////////////////// DRIVER'S STATUS ////////////////////////
  mongodbSchema.methods.updateProfitRate = function (profitRate) {
    this.driverStatus.profitRate = profitRate;
  };
};

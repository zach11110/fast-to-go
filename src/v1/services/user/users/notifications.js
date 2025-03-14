const { User } = require("../../../models/user/user");
const notificationsService = require("../../cloud/notifications");
const serverErrorsService = require("../../system/serverErrors");
const innerServices = require("./inner");
const { user: userConfig } = require("../../../config/models");
const { getIO } = require("../../../setup/socket");
const {
  user: userNotifications,
  admin: adminNotifications,
} = require("../../../config/notifications");

module.exports.sendAcceptedTripToUser = async (user) => {
  const notification = userNotifications.acceptedTrip();

  await this.sendNotificationToUser(user, notification);
};

module.exports.notifyUsersWithUnseenNotifications = async () => {
  try {
    // Find users with unseen notifications
    const users = await User.find({
      "notifications.list": { $elemMatch: { seen: false } },
    });

    // Check if there are users with unseen notifications
    if (!users || !users.length) {
      return;
    }

    const notification = userNotifications.hasUnreadNotifications();

    // Pick only users that they haven't received this notification
    const userIds = users
      .filter((user) => !user.hasReceivedNotification(notification))
      .map((user) => user._id);

    // Check if there are users that they haven't received
    // this notification yet.
    if (!userIds || !userIds.length) {
      return;
    }

    await this.sendNotificationToUsers(userIds, notification);
  } catch (err) {
    return;
  }
};

module.exports.notifyAdminsWithServerErrors = async () => {
  try {
    // Find users with unseen notifications
    const admins = await User.find({ role: "admin" });

    // Check if there are users with unseen notifications
    if (!admins || !admins.length) {
      return;
    }

    // Check if there are server errors occurred
    const serverErrorsCount = await serverErrorsService.getAllErrorsCount();
    if (!serverErrorsCount) {
      return;
    }

    // Construct the notification object
    const notification =
      adminNotifications.serverErrorsOccurred(serverErrorsCount);

    // Pick only users that they haven't received this notification
    const adminIds = admins
      .filter((admin) => !admin.hasReceivedNotification(notification))
      .map((admin) => admin._id);

    // Check if there are users that they haven't received
    // this notification yet.
    if (!adminIds || !adminIds.length) {
      return;
    }

    await this.sendNotificationToUsers(adminIds, notification);
  } catch (err) {
    return;
  }
};

module.exports.sendNotificationToUsers = async (
  userIds,
  notification,
  callback
) => {
  try {
    // Validate callback function
    callback = typeof callback === "function" ? callback : () => {};

    // Decide query criteria based on array of users
    const queryCriteria = userIds.length
      ? { _id: { $in: userIds } }
      : { role: { $not: { $in: ["admin"] } } };

    // Check if there are users
    const users = await User.find(queryCriteria);
    if (!users || !users.length) {
      return;
    }

    // Get users' tokens and add notification to them
    const mappedUsers = users
      .map((user) => {
        try {
          // Add notification to user
          user.addNotification(notification);

          // Save user to the DB
          user.save();

          return {
            lang: user.getLanguage(),
            token: user.getDeviceToken(),
            active: user.isNotificationsActive(),
          };
        } catch (err) {
          return {};
        }
      })
      .filter((user) => user.active);

    // Get device tokens for english users
    const enTokens = mappedUsers
      .filter((user) => user.lang === "en")
      .map((user) => user.token);

    // Get device tokens for arabic users
    const arTokens = mappedUsers
      .filter((user) => user.lang === "ar")
      .map((user) => user.token);

    // Send notifications to users by socket
    userIds.forEach((userId) => {
      try {
        getIO().to(userId).emit("notification received", notification);
      } catch (err) {
        throw err;
      }
    });

    // Send notification to english users
    notificationsService.sendPushNotification(
      notification.title.en,
      notification.body.en,
      enTokens,
      callback,
      notification.photoURL
    );

    // Send notification to arabic users
    notificationsService.sendPushNotification(
      notification.title.ar,
      notification.body.ar,
      arTokens,
      callback,
      notification.photoURL
    );

    return true;
  } catch (err) {
    throw err;
  }
};

module.exports.sendNotificationToUser = async (
  user,
  notification,
  callback
) => {
  try {
    // Validate callback function
    callback = typeof callback === "function" ? callback : () => {};

    // Add notification to user
    user.addNotification(notification);
    await user.save();

    // Send notifications to the user by socket
    console.log("In notification");

    getIO().to(user._id).emit("notification received", notification);

    // Send notification to the user by FCM
    if (user.isNotificationsActive()) {
      notificationsService.sendPushNotification(
        notification.title[user.display.language],
        notification.body[user.display.language],
        [user.deviceToken],
        callback,
        notification.photoURL
      );
    }

    return true;
  } catch (err) {
    throw err;
  }
};

module.exports.sendNotificationToAdmins = async (notification, callback) => {
  try {
    // Validate callback function
    callback = typeof callback === "function" ? callback : () => {};

    // Check if there are admins
    const admins = await innerServices.findAdmins();
    if (!admins || !admins.length) {
      return;
    }

    // Get admins' tokens and add notification to them
    const mappedAdmins = admins.map((admin) => {
      try {
        // Add the notification to user's notifications array
        admin.addNotification(notification);

        // Save the user to the database
        admin.save();

        return {
          lang: admin.getLanguage(),
          token: admin.getDeviceToken(),
          isNotificationsActive: admin.isNotificationsActive(),
        };
      } catch (err) {
        return {};
      }
    });

    //  mappedAdmins.filter((admin) => admin.isNotificationsActive);

    // Get device tokens for english users
    const enTokens = mappedAdmins
      .filter((admin) => admin.lang === "en")
      .map((admin) => admin.token);

    // Get device tokens for arabic users
    const arTokens = mappedAdmins
      .filter((admin) => admin.lang === "ar")
      .map((admin) => admin.token);

    // Send notifications to users by socket
    admins.forEach((admin) => {
      try {
        getIO()
          .to(admin._id.toString())
          .emit("notification received", notification);
      } catch (err) {
        throw err;
      }
    });

    // Send notification to english users
    notificationsService.sendPushNotification(
      notification.title.en,
      notification.body.en,
      enTokens,
      callback,
      notification.photoURL
    );

    // Send notification to arabic users
    notificationsService.sendPushNotification(
      notification.title.ar,
      notification.body.ar,
      arTokens,
      callback,
      notification.photoURL
    );

    return true;
  } catch (err) {
    throw err;
  }
};

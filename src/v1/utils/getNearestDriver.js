const httpStatus = require("http-status");

const errors = require("../config/errors");

const error = require("../middleware/apiError");

module.exports = function (drivers, MAX_DISTANCE) {
  // Filter drivers that are exceeds max distance
  drivers = drivers.filter((driver) => {
    return driver._doc.distance <= MAX_DISTANCE;
  });

  // If no drivers cancel the trip
  if (!drivers.length) {
    return null;
  }

  // Find nearest driver
  return getClosestDriver(drivers);
};

function getClosestDriver(drivers) {
  let min = 100000000;
  let minIdx = -1;
  let len = drivers.length;

  for (let i = 0; i < len; i++) {
    if (drivers[i]._doc.distance < min) {
      min = drivers[i]._doc.distance;
      minIdx = i;
    }
  }

  return drivers[minIdx];
}

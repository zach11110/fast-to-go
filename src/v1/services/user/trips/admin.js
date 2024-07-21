const { Trip } = require("../../../models/user/trip");

module.exports.getTripsStats = async () => {
  try {
    const allTripsNo = await Trip.countDocuments({});

    return {
      allTripsNo,
    };
  } catch (err) {
    throw err;
  }
};

module.exports.getAllTrips = async (page, limit) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);
  
    return await Trip.find({})
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // const trips = await Trip.find({})
    //   .sort({ _id: -1 })
    //   .skip((page - 1) * limit)
    //   .limit(limit);
    
    // if (!trips || !trips.length) {
    //   const statusCode = httpStatus.NOT_FOUND;
    //   const message = errors.trip.noTrips;
    //   throw new ApiError(statusCode, message);
    // }

    // return trips;
  } catch (err) {
    
    throw err;
  }
};
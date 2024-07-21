const colors = require("colors");

module.exports = (req, res, next) => {
  const methodColors = {
    GET: "green",
    POST: "yellow",
    PUT: "blue",
    PATCH: "magenta",
    DELETE: "red",
  };

  const color = methodColors[req.method] || "white";

  // if (
  //   req.originalUrl === "/api/users/location/update" ||
  //   req.originalUrl ===
  //     "/api/users/admin/drivers/get?driverStatus=all&page=undefined&limit=undefined" ||
  //   req.originalUrl === "/api/workSpaces/get"
  // ) {
  //   return next();
  // }

  console.log(`${req.method} ${req.originalUrl}`[color]);
  next();
};

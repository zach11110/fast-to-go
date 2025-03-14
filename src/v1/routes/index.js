const router = require("express").Router();

const authRoute = require("./user/auth");
const usersRoute = require("./user/users");
const tripsRoute = require("./user/trips");
const carsRoute = require("./user/cars");

const challengesRoute = require("./system/challenges");
const paymentCardsRoute = require("./system/paymentCards");
const errorsRoute = require("./system/errors");
const tripPricingsRoute = require("./system/tripPricings");
const couponCodesRoute = require("./system/couponCodes");
const workSpacesRoute = require("./system/workSpaces");

const routes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/users",
    route: usersRoute,
  },
  {
    path: "/trips",
    route: tripsRoute,
  },
  {
    path: "/challenges",
    route: challengesRoute,
  },
  {
    path: "/cards/payment",
    route: paymentCardsRoute,
  },
  {
    path: "/cars",
    route: carsRoute,
  },
  {
    path: "/workSpaces",
    route: workSpacesRoute,
  },
  {
    path: "/errors",
    route: errorsRoute,
  },
  {
    path: "/trips/pricing",
    route: tripPricingsRoute,
  },
  {
    path: "/coupons",
    route: couponCodesRoute,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;

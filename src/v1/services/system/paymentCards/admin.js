const { PaymentCard } = require("../../../models/system/paymentCard");
const httpStatus = require("http-status");
const { ApiError } = require("../../../middleware/apiError");
const errors = require("../../../config/errors");
const { paymentCard } = require("../../../config/models");
const crypto = require("crypto");

module.exports.addPaymentCard = async (cardCode, balance) => {
  try {
    const paymentCard = new PaymentCard({
      code: cardCode,
      balance,
    });

    await paymentCard.save();

    return paymentCard;
  } catch (err) {
    if (err.code === errors.codes.duplicateIndexKey) {
      const statusCode = httpStatus.FORBIDDEN;
      const message = errors.paymentCard.alreadyAdded;
      err = new ApiError(statusCode, message);
    }

    throw err;
  }
};

module.exports.autoAddPaymentCards = async (balance, count) => {
  try {
    let paymentCardsAdded = 0;
    let code;

    while (true) {
      if (paymentCardsAdded === count) {
        return true;
      }

      const randomBytes = Math.floor(paymentCard.code.exactLength / 2);
      const hexString = crypto.randomBytes(randomBytes).toString("hex");

       // Remove any non-numeric characters from the hex string
        code = hexString.replace(/[^0-9]/g, Math.floor(Math.random() * (9 - 1 + 1)) + 1);


      const existingCode = await PaymentCard.findOne({ code });
      if (!existingCode) {
        const paymentCard = new PaymentCard({ code, balance });
        await paymentCard.save();
        ++paymentCardsAdded;
      }
    }
  } catch (err) {
    console.log(err)
    throw err;
  }
};

module.exports.getAllPaymentCards = async (page, limit) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);

    const paymentCards = await PaymentCard.find({})
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!paymentCards || !paymentCards.length) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.paymentCard.noPaymentCards;
      throw new ApiError(statusCode, message);
    }

    return paymentCards;
  } catch (err) {
    throw err;
  }
};

module.exports.deletePaymentCard = async (paymentCardId) => {
  try {
    const paymentCard = await PaymentCard.findByIdAndDelete(paymentCardId);
    if (!paymentCard) {
      const statusCode = httpStatus.NOT_FOUND;
      const message = errors.paymentCard.notFound;
      throw new ApiError(statusCode, message);
    }

    return paymentCard;
  } catch (err) {
    throw err;
  }
};

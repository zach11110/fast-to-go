const { Schema } = require("mongoose");
const { tripPricing: tripPricingConfig } = require("../../../config/models");

module.exports.client = ["_id", "title", "points"];

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 4,
      default: "unknowen location",
    },
    points: {
      type: Array,
      min: 3,
      required: true,
    },
  },
  {
    // To not avoid empty object when creating the document
    minimize: false,
    // To automatically write creation/update timestamps
    // Note: the update timestamp will be updated automatically
    timestamps: true,
  }
);

module.exports.mongodb = schema;

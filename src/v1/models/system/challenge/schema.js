const { Schema } = require("mongoose");
const {
  user: userConfig,
  challenge: challengeConfig,
} = require("../../../config/models");

module.exports.client = [
  "_id",
  "role",
  "reward",
  "referralTarget",
  "tripTarget",
];

const schema = new Schema(
  {
    role: {
      type: String,
      enum: userConfig.roles.filter((r) => r !== "admin"),
      required: true,
      trim: true,
    },
    reward: {
      type: Number,
      required: true,
      min: challengeConfig.reward.min,
      max: challengeConfig.reward.max,
    },
    referralTarget: {
      type: Number,
      default: 0,
      min: challengeConfig.referralTarget.min,
      max: challengeConfig.referralTarget.max,
    },
    tripTarget: {
      type: Number,
      default: 0,
      min: challengeConfig.tripTarget.min,
      max: challengeConfig.tripTarget.max,
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

schema.index({ role: 1 });

module.exports.mongodb = schema;

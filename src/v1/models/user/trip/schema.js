const { Schema, Types } = require("mongoose");
const { car: carConfig, trip: tripConfig } = require("../../../config/models");

module.exports.client = [
  "_id",
  "approved",
  "passengerId",
  "driverId",
  "dismissiveDrivers",
  "paymentMethod",
  "carType",
  "from",
  "to",
  "createdAt",
  "price",
  "cancelled",
];

const schema = new Schema(
  {
    approved: {
      type: Boolean,
      required: true,
      default: false,
    },
    passengerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    driverId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    dismissiveDrivers: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
      enum: tripConfig.paymentMethods,
    },
    carType: {
      type: String,
      required: true,
      trim: true,
      enum: carConfig.carTypes,
    },
    from: {
      title: {
        type: String,
        required: true,
        trim: true,
      },
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    to: {
      title: {
        type: String,
        required: true,
        trim: true,
      },
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    price: {
      type: Number,
      required: true,
    },
    cancelled: {
      type: Boolean,
      default: false,
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

schema.index({ driverId: -1 });
schema.index({ passengerId: -1 });

module.exports.mongodb = schema;

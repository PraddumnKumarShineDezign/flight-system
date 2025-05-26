const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema(
  {
    airline: { type: String, required: true, trim: true },
    flightNumber: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    arrivalDateTime: { type: Date, required: true },   
    departureDateTime: { type: Date, required: true, trim: true },
    seatsAvailable: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    isDeleted: { type: Boolean, default: false },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);
flightSchema.index({ origin: 1, destination: 1, departureDateTime: 1 });

module.exports = { FlightModel: mongoose.model("flights", flightSchema) };

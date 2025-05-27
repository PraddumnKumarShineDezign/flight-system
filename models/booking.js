const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    flightId: { type: mongoose.Schema.Types.ObjectId, ref: "Flight", required: true },
    passengerName: { type: String, required: true, trim: true },
    passengers: { type: Number, required: true },
    seatCount: { type: Number, required: true },
    bookingDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = { BookingModel: mongoose.model("bookings", bookingSchema) };

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    flightId: { type: mongoose.Schema.Types.ObjectId, ref: "flights", required: true },
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PassengerDetails', required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentDetails', required: true },
    seats: { type: Number, required: true, min: 1 },
    specialRequests: { type: String, default: "" },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Booked', 'Cancelled'], default: 'Booked' },
    bookingDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = { BookingModel: mongoose.model("bookings", bookingSchema) };


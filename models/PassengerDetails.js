const mongoose = require('mongoose');

const passengerDetailsSchema = new mongoose.Schema({
    firstName: { type: String, required: false, trim: true },
    lastName: { type: String, required: false, trim: true },
    email: { type: String, required: false, lowercase: true },
    phone: { type: String, required: false },
    passport: { type: String, required: false }
}, { timestamps: true });

module.exports = { PassengerDetailsModel: mongoose.model("PassengerDetails", passengerDetailsSchema) };
const mongoose = require('mongoose');

const paymentDetailsSchema = new mongoose.Schema({
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking'],
        required: false
    },
    cardNumber: { type: String, required: false },
    expiryDate: { type: String, required: false },
    cvv: { type: String, required: false }
}, { timestamps: true });


module.exports = { PaymentDetailsModel: mongoose.model("PaymentDetails", paymentDetailsSchema) };

const { body, param, validationResult, check } = require('express-validator');
const { statusCode } = require('../../helper/statusCodes.js');

function validator(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(statusCode.BAD_REQUEST).json({ message: errors.errors[0].msg, status: 0 });
    }
    next();
}
module.exports = {
    list: [
        body('page')
            .optional({ nullable: true, checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer.'),

        body('limit')
            .optional({ nullable: true, checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage('Limit must be a positive integer.'),

        body('origin')
            .optional({ nullable: true, checkFalsy: true })
            .isString()
            .trim()
            .withMessage('Origin must be a valid string.'),

        body('destination')
            .optional({ nullable: true, checkFalsy: true })
            .isString()
            .trim()
            .withMessage('Destination must be a valid string.'),

        body('airline')
            .optional({ nullable: true, checkFalsy: true })
            .isString()
            .trim()
            .withMessage('Airline must be a valid string.'),

        body('departureDateTime')
            .optional({ nullable: true, checkFalsy: true })
            .isISO8601()
            .toDate()
            .withMessage('departureDateTime must be a valid ISO 8601 date.'),

        validator
    ],

    idValidation: [
        param("flightId")
            .trim()
            .notEmpty()
            .withMessage("Please provide flight id")
            .isMongoId()
            .withMessage("Invalid flight id"),
        validator
    ],

    bookFlightValidation: [
        body("flightId")
            .trim()
            .notEmpty()
            .withMessage("Please provide flight id")
            .isMongoId()
            .withMessage("Invalid flight id"),

        body("seats")
            .notEmpty()
            .withMessage("Please provide seat count")
            .isInt({ min: 1 })
            .withMessage("Seats must be at least 1"),

        body("specialRequests")
            .optional()
            .isString()
            .withMessage("Special requests must be a string"),

        body("totalPrice")
            .notEmpty()
            .withMessage("Total price is required")
            .isNumeric()
            .withMessage("Total price must be a number"),

        // Validate passengerDetails
        body("passengerDetails").notEmpty().withMessage("Passenger details are required"),

        body("passengerDetails.firstName")
            .notEmpty()
            .withMessage("First name is required")
            .isAlpha("en-US", { ignore: " " })
            .withMessage("First name must contain only letters"),

        body("passengerDetails.lastName")
            .notEmpty()
            .withMessage("Last name is required")
            .isAlpha("en-US", { ignore: " " })
            .withMessage("Last name must contain only letters"),

        body("passengerDetails.email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Invalid email format"),

        body("passengerDetails.phone")
            .notEmpty()
            .withMessage("Phone is required")
            .matches(/^[0-9]{10}$/)
            .withMessage("Phone must be a valid 10-digit number"),

        body("passengerDetails.passport")
            .notEmpty()
            .withMessage("Passport number is required"),

        // Validate paymentDetails
        body("paymentDetails").notEmpty().withMessage("Payment details are required"),

        body("paymentDetails.paymentMethod")
            .notEmpty()
            .withMessage("Payment method is required")
            .isIn(["Credit Card", "Debit Card", "UPI", "Net Banking"])
            .withMessage("Invalid payment method"),

        body("paymentDetails.cardNumber")
            .notEmpty()
            .withMessage("Card number is required")
            .matches(/^[0-9]{16}$/)
            .withMessage("Card number must be a 16-digit number"),

        body("paymentDetails.expiryDate")
            .notEmpty()
            .withMessage("Expiry date is required")
            .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)
            .withMessage("Expiry date must be in MM/YY format"),

        body("paymentDetails.cvv")
            .notEmpty()
            .withMessage("CVV is required")
            .matches(/^[0-9]{3,4}$/)
            .withMessage("CVV must be 3 or 4 digits"),
        validator,
    ],

}

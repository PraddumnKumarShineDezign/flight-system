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

}

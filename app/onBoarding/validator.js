const { body, validationResult, check } = require('express-validator');
const { statusCode } = require('../../helper/statusCodes.js');

function validator(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(statusCode.BAD_REQUEST).json({ message: errors.errors[0].msg, status: 0 });
    }
    next();
}
const login = [
    body('email')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide email address')
        .isEmail()
        .withMessage('Invalid email address!'),

    body('password')
        .trim()
        .escape()
        .not()
        .isEmpty()
        .withMessage('Please provide password.'),
        validator
]



module.exports = {
    login
}
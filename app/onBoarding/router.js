const express = require('express');
const router = express.Router();
const controller = require("./controller");
const validators = require("./validator");

/**
 * @description routes for onboarding processes
 */
router.post('/login', validators.login, controller.login);

const onBoarding = router;
module.exports = onBoarding;
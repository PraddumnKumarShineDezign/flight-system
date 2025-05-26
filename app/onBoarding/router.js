const express = require('express');
const router = express.Router();
const controller = require("./controller");
const validators = require("./validator");
// import * as controller from './controller.js';
// import * as validators from './validator.js';

/**
 * @description routes for onboarding processes
 */
router.post('/login',validators.login, validators.validator, controller.login);

const onBoarding = router;
module.exports =  onBoarding;
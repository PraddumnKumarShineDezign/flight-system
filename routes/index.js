var express = require('express');
const { verifyAuthToken } = require("../middleware/verifyToken.js");
const onboardingR = require("../app/onBoarding/router.js");
const flightR = require("../app/flights/router.js");

var router = express.Router();

router.use('/onboarding', onboardingR);

// verify token before every request
router.use((req, res, next) => {
  verifyAuthToken(req, res, next);
});

router.use("/flight", flightR)


module.exports = router;

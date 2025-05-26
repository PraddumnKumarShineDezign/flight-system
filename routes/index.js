var express = require('express');
const userR = require("../app/v1/user/router")
const onboardingR = require("../app/v1/onBoarding/router")

var router = express.Router();

router.use('/onboarding', onboardingR);

// verify token before every request
const { verifyToken } = require("../middleware/verifyJWT.js");
router.use((req, res, next) => {
  verifyToken(req, res, next);
});

router.use("/flight", cmsR)


module.exports = router;

const express = require("express");
const router = express.Router();
const controller = require("./controller.js");
const Validator = require("./validator.js");
const { swagToken } = require("../../middleware/swaggerD")

router.use(swagToken)
/**
 * @description flight list route
 */
router.post("/list", Validator.list, controller.list);

/**
 * @description : Book flight
 */
router.post("/book", Validator.bookFlightValidation, controller.bookFlight)

/**
 * @description : get flight details by id
 */
router.get("/:flightId", Validator.idValidation, controller.getFlightById)


/**
 * @description : get my bookings flight
 */
router.get("/bookings/my", controller.getMyBookings)

module.exports = router;

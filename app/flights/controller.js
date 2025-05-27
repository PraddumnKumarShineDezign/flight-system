const { FlightModel } = require("../../models/flight");
const { messages } = require("../../helper/messages");
const { BookingModel } = require("../../models/booking");

module.exports = {
  /**
   * @description : Get Flight List data to search result 
   */
  list: async (req, res) => {
    try {
      let { page, limit, origin, destination, airline, departureDateTime } = req.body;
      page = Math.max(parseInt(page) || 1, 1);
      limit = Math.max(parseInt(limit) || 10, 1);
      skip = (page - 1) * limit;

      const filters = {
        isDeleted: false,
        status: "Active"
      };

      if (origin) {
        filters.origin = { $regex: origin, $options: "i" };
      }
      if (destination) {
        filters.destination = { $regex: destination, $options: "i" };
      }
      if (airline) {
        filters.airline = { $regex: airline, $options: "i" };
      }
      if (departureDateTime) {
        const date = new Date(departureDateTime);
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        filters.departureDateTime = { $gte: date, $lt: nextDate };
      }

      const [flights, total] = await Promise.all([
        FlightModel.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        FlightModel.countDocuments(filters)
      ]);

      return res.status(200).send({
        message: "Flight list fetched successfully",
        data: { flights, total, page, pages: Math.ceil(total / limit) }
      });

    } catch (error) {
      console.error("Flight List error:", error);
      return res.status(500).send({
        message: error.message || "Something went wrong"
      });
    }
  },

  /**
   * @description : Booking flight 
   */
  bookFlight: async (req, res) => {
    try {
      const userId = req?.decoded?._id;
      const { flightId, passengers } = req.body;

      const flight = await FlightModel.findById(flightId);

      if (!flight || flight.seatsAvailable < passengers) {
        return res.status(400).json({ message: "Flight not found or not enough seats" });
      }

      const totalAmount = flight.price * passengers;

      const booking = await BookingModel.create({
        flightId,
        userId,
        passengers,
        totalAmount
      });

      flight.seatsAvailable -= passengers;
      await flight.save();

      return res.status(200).json({ message: "Flight booked", data: booking });

    } catch (err) {
      console.error("Booking error:", err);
      return res.status(500).json({ message: "Server Error" });
    }
  },

  /**
   * @description get flight by id 
   */
  getFlightById: async (req, res) => {
    try {
      const { flightId } = req.params;

      const flight = await FlightModel.findOne({
        _id: flightId,
        isDeleted: false,
        status: "Active"
      });

      if (!flight) {
        return res.status(404).send({ message: "Flight not found" });
      }

      return res.status(200).send({
        message: "Flight details fetched successfully",
        data: flight
      });
    } catch (error) {
      console.error("Get flight error:", error);
      return res.status(500).send({ message: error.message || "Something went wrong" });
    }
  },

  /**
   * @description : get my bookings
   */
  getMyBookings: async (req, res) => {
    try {
      const userId = req?.decoded?._id;

      const bookings = await BookingModel.find({ userId })
        .populate("flightId")
        .sort({ createdAt: -1 });

      return res.status(200).send({
        message: "Booking history fetched successfully",
        data: bookings
      });
    } catch (error) {
      console.error("Get bookings error:", error);
      return res.status(500).send({ message: error.message || "Something went wrong" });
    }
  },

}
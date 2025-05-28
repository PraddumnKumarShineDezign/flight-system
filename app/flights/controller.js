const { messages } = require("../../helper/messages");
const { FlightModel } = require("../../models/flight");
const { BookingModel } = require("../../models/booking");
const { PassengerDetailsModel } = require("../../models/PassengerDetails");
const { PaymentDetailsModel } = require("../../models/PaymentDetails");
const mongoose = require('mongoose');

module.exports = {
  /**
   * @description : Get Flight List data to search result 
   */
  list: async (req, res) => {
    try {
      let { page, limit, origin, destination, airline, departureDateTime, numberOfPassengers } = req.body;
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
      if (numberOfPassengers) {
        filters.seatsAvailable = { $gte: parseInt(numberOfPassengers) };
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
      const {
        flightId,
        seats,
        passengerDetails, paymentDetails, specialRequests, totalPrice } = req.body;
      console.log("paymentDetails", paymentDetails)

      const flight = await FlightModel.findById(flightId);

      if (!flight || flight.seatsAvailable < seats) {
        return res.status(400).json({ message: "Flight not found or not enough seats" });
      }

      const existingBooking = await BookingModel.findOne({
        userId,
        flightId,
        status: { $ne: "Cancelled" }
      });

      //check if user already book flight then send res.
      if (existingBooking) {
        return res.status(400).json({ message: "You have already booked this flight." });
      }

      const [savedPassenger, savedPayment] = await Promise.all([
        PassengerDetailsModel.create(passengerDetails),
        PaymentDetailsModel.create(paymentDetails),
      ]);

      const booking = await BookingModel.create({
        userId,
        flightId,
        passengerId: savedPassenger._id,
        paymentId: savedPayment._id,
        seats,
        totalAmount: totalPrice,
        specialRequests: specialRequests || "",
        status: "Booked",
        bookingDate: new Date()
      });

      // Update flight seats
      flight.seatsAvailable -= seats;
      await flight.save();

      return res.status(200).json({
        message: "Flight booked successfully",
        data: booking
      });
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
      console.log("userId", userId);

      const bookings = await BookingModel.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) }
        },
        {
          $lookup: {
            from: "flights",
            localField: "flightId",
            foreignField: "_id",
            as: "flight"
          }
        },
        { $unwind: "$flight" },
        {
          $lookup: {
            from: "passengerdetails",
            localField: "passengerId",
            foreignField: "_id",
            as: "passenger"
          }
        },
        { $unwind: "$passenger" },
        {
          $lookup: {
            from: "paymentdetails",
            localField: "paymentId",
            foreignField: "_id",
            as: "payment"
          }
        },
        { $unwind: "$payment" },
        {
          $sort: { createdAt: -1 }
        },
        {
          $project: {
            userId: 1,
            seats: 1,
            specialRequests: 1,
            totalAmount: 1,
            status: 1,
            bookingDate: 1,
            flight: {
              flightNumber: 1,
              origin: 1,
              destination: 1,
              departureTime: 1,
              arrivalTime: 1
            },
            passenger: {
              firstName: 1,
              lastName: 1,
              email: 1,
              phone: 1,
              passport: 1
            },
            payment: {
              paymentMethod: 1,
              cardNumber: 1,
              expiryDate: 1
            }
          }
        }
      ]);

      return res.status(200).json({
        message: "Booking history fetched successfully",
        data: bookings
      });
    } catch (error) {
      console.error("Get bookings error:", error);
      return res.status(500).json({ message: error.message || "Something went wrong" });
    }
  }
}
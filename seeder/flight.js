const db = require('../connection');
const { FlightModel } = require("../models/flight");

const cityPairs = [
    ["New York", "London"],
    ["Delhi", "Dubai"],
    ["Tokyo", "Sydney"],
    ["Toronto", "Paris"],
    ["San Francisco", "Singapore"],
    ["Berlin", "Rome"],
    ["Los Angeles", "Chicago"],
    ["Mumbai", "Bangkok"],
    ["Beijing", "Seoul"],
    ["Cape Town", "Nairobi"],
];

const airlines = [
    "Air India", "Emirates", "British Airways", "Qantas", "United Airlines",
    "Lufthansa", "Air France", "Singapore Airlines", "American Airlines", "Turkish Airlines"
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const addHours = (date, hours) => new Date(date.getTime() + hours * 3600000);

const generateFlights = () =>
    cityPairs.map(([origin, destination], i) => {
        const dep = new Date(Date.now() + i * 86400000); // +i days
        return {
            airline: airlines[i],
            flightNumber: `FL${1000 + i}`,
            origin,
            destination,
            departureDateTime: dep,
            arrivalDateTime: addHours(dep, rand(2, 10)),
            seatsAvailable: rand(50, 200),
            price: rand(100, 1500),
            status: "Active",
        };
    });

(async () => {
    try {
        db.connect();
        await FlightModel.deleteMany();
        await FlightModel.insertMany(generateFlights());
        console.log("Seeded 10 flights successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err.message);
        process.exit(1);
    }
})();

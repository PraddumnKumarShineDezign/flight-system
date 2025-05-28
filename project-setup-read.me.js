/**
 * @description Project Setup Instructions
 *  @repository https://github.com/PraddumnKumarShineDezign/flight-system
 * Follow these steps to set up and run the Flight Booking Project:
 */

console.log(`
     FLIGHT BOOKING PROJECT SETUP GUIDE
    Repository: https://github.com/PraddumnKumarShineDezign/flight-system
    
    1.  CLONE & NAVIGATE TO PROJECT
       Make sure you have Node.js (v14 or above) installed.
       Clone the project repository and navigate into it:
       > git clone <your-repo-url>
       > cd <your-project-folder>
    
    2.  INSTALL DEPENDENCIES
       Run the following command to install all required packages:
       > npm install
    
    3.  RUN SEEDERS
       Before starting the project, seed the database with test users and flight data.
    
       a. Generate Swagger Docs:
          > npm run generate-docs
    
       b. Seed Users:
          > npm run userSeed
    
       c. Seed Flights:
          > npm run flightSeed
    
    4. START THE SERVER
       You can run the project using either of the below commands:
    
       a. If you have nodemon installed globally:
          > nodemon
    
       b. Otherwise, use npm start:
          > npm start
    
    The server should be running on:
       http://localhost:4001/
    
    API Documentation (Swagger UI):
       http://localhost:4001/api-docs
    
    Make sure MongoDB is running before starting the server.
    `);

const { UserModel } = require("../models/users");
const db = require('../connection');
const { generatePassword } = require("../helper/becrypt")


const seedUsers = async () => {
    try {
        db.connect();
        console.log("Connected to MongoDB");

        // Optional: Clear existing users
        await UserModel.deleteMany({});
        console.log("Existing users removed.");

        const hashedPassword = generatePassword("Password@123");

        const users = [
            {
                firstName: "Alice",
                lastName: "Smith",
                email: "alice@yopmail.com",
                password: hashedPassword,
                isEmailVerified: true,
            },
            {
                firstName: "Bob",
                lastName: "Johnson",
                email: "bob@yopmail.com",
                password: hashedPassword,
                status: "Inactive",
            },
            {
                firstName: "Charlie",
                lastName: "Lee",
                email: "charlie@yopmail.com",
                password: hashedPassword,
            },
            {
                firstName: "Diana",
                lastName: "King",
                email: "diana@yopmail.com",
                password: hashedPassword,
                isDeleted: true,
            },
            {
                firstName: "Ethan",
                lastName: "Wright",
                email: "ethan@yopmail.com",
                password: hashedPassword,
                status: "Active",
                isEmailVerified: true,
            },
        ];

        await UserModel.insertMany(users);
        console.log("Users seeded successfully.");

        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedUsers();

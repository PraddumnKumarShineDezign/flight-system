const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = { UserModel: mongoose.model("user", UserSchema) };

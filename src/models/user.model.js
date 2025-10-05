import mongoose from "mongoose";
import validator from "validator";
import { minLength } from "zod";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: [true, "Please provide a username"] },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      validate: {
        validator: (val) => validator.isEmail(val),
        message: "Email field must have a correct email format",
      },
    },
    role: { type: String, default: "user" },
    active: { type: Boolean, default: true },
    photo: String,
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minLength: 8,
    },
    confirmPassword: {
      type: String,
      required: [true, "Please confirm your password"],
    },
  },
  { timestamps: true }
);

const User = model("User", userSchema);

export default User;

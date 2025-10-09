import mongoose from "mongoose";
import validator from "validator";
import { genSalt, hash } from "bcrypt";

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
      validate: {
        // Only works on CREATE and SAVE!
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords do not match",
      },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // Only runs if modified
  if (!this.isModified("password")) {
    return next();
  }
  const saltRounds = Number(process.env.SALTROUNDS);
  const salt = await genSalt(saltRounds);
  this.password = await hash(this.password, salt);

  this.confirmPassword = undefined;

  next();
});

const User = model("User", userSchema);

export default User;

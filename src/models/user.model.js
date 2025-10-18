import crypto from "crypto";
import mongoose from "mongoose";
import validator from "validator";
import { genSalt, hash, compare } from "bcrypt";

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
    role: {
      type: String,
      enum: ["user", "guide", "lead-guide", "admin"],
      default: "user",
    },
    active: { type: Boolean, default: true, select: false },
    photo: String,
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minLength: 8,
      select: false, // Prevents password from showing in any output
    },
    confirmPassword: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        // Only works on CREATE and SAVE
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords do not match",
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: { type: String },
    passwordResetExpires: Date,
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

userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  // If the password is being updated, hash it first.
  // This is needed because findOneAndUpdate bypasses pre('save') middleware,
  // so without this hook, updated passwords would be stored in plain text.
  if (update.password) {
    const salt = await genSalt(Number(process.env.SALTROUNDS) || 12);
    update.password = await hash(update.password, salt);
  }

  // Ensure confirmPassword is never persisted
  delete update.confirmPassword;

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // Makes sure that the signToken generates tokens that are created after passwordChangedAt
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // Returns true if changedTimestamp is larger than the JWTTimestamp
    return JWTTimestamp < changedTimestamp;
  }

  // false eqals password has not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = model("User", userSchema);

export default User;

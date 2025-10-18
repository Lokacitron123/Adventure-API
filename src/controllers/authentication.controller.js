import { promisify } from "node:util";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { sendEmail } from "../utils/email.js";
import { hash } from "bcrypt";

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendStatusAndToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });
};

// -------------------------------------- //

export const signUpUser = catchAsync(async (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  const newUser = await User.create({
    name: name,
    email: email,
    password: password,
    confirmPassword: confirmPassword,
  });

  createSendStatusAndToken(newUser, 201, res);
});

export const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  // Option 1, less safe
  // if (!user) {
  //   return next(new AppError(`No user with email ${email} found.`, 404));
  // }

  // const correct = await user.correctPassword(password, user.password);

  // if (!correct) {
  //   return next(new AppError("Wrong password", 401));
  // }

  // Option 2
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password provided", 401));
  }

  createSendStatusAndToken(user, 200, res);
});

export const logoutUser = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "User successfully logged out",
  });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("Email not found", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send the email
  try {
    await sendEmail({ email, resetToken });

    res.status(200).json({
      status: "success",
      message:
        "Password reset email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordReset = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "Something went wrong while sending the password reset email. Please try again later.",
        500
      )
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save(); // Middleware auto updates changedPasswordAt on save

  createSendStatusAndToken(user, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(
      new AppError("Please provide both your current and new password.", 400)
    );
  }

  // 1) Get user
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if old password is correct and if user exists
  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  // 3) Check if current password is correct
  const isPasswordCorrect = await user.correctPassword(
    currentPassword,
    user.password
  );

  if (!isPasswordCorrect) {
    return next(new AppError("Your current password is incorrect.", 401));
  }

  // 4) Update password and save (triggers hashing middleware)
  // Skipping confirmPassword validator because of eaze of use for the user
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // 5) Log in user (send new JWT)
  createSendStatusAndToken(user, 200, res);
});

// Protection Middleware
export const protectRoute = catchAsync(async (req, res, next) => {
  // (1), Get token
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in again.", 401)
    );
  }

  // (2), Verify token
  // Node's inbuilt promisify returns a function that returns promises
  // Useful when you want to await, so that catchAsync can catch errors
  // // const verifyAsync = await promisify(jwt.verify);
  // const decoded = await verifyAsync(token, process.env.JWT_SECRET);

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // (3), Check if user till exists
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(
      new AppError(
        "The user do not match this token, or no longer exists.",
        401
      )
    );
  }

  // (4), Check if user changed password after token was issued using model instance method that returns a true or false value
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password. Please log in again.", 401)
    );
  }

  // Passes the user with its roles to restrictTo in the request
  req.user = user;
  next();
});

// Express calls middleware
export const restrictTo = (...roles) => {
  // roles is equal to an array and is available in this outer scope
  return (req, res, next) => {
    // Express will call this function automatically
    // but it can still access roles through javascript closure from the wrapper function

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

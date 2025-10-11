import AppError from "../utils/appError.js";

// MongoDB & Mongoose error handler
const handleCastErrorDB = (err) => {
  console.log("Logging from handleCastErrorDB. Error: ", err);
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  console.log("Logging from handleDuplicateFieldsDB. Error: ", err);
  const match = err.errmsg.match(/(["'])(.*?)\1/);
  const value = match ? match[2] : "unknown value";
  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(". ")}`;

  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  return new AppError("Invalid token. Please login again.", 401);
};

const handleExpiredTokenError = (err) => {
  return new AppError("Token is expired. Please log in again", 401);
};

// -------------------------

const sendErrorDev = (err, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProduction = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unkown error: send generic error message to not leak error details
  } else {
    // Log error
    console.error("ERROR: ", err);

    // Send generic error message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = err;

    console.log("logging production error: ", error);

    if (error.name === "CastError") {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === "ValidationError") {
      error = handleValidationErrorDB(error);
    }
    if (error.name === "JsonWebTokenError") {
      error = handleJWTError(error);
    }
    if (error.name === "TokenExpiredError") {
      error = handleExpiredTokenError(error);
    }

    sendErrorProduction(error, res);
  }
};

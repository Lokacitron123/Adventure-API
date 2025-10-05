import express from "express";
import morgan from "morgan";
import qs from "qs";
import { connectDB } from "./config/db.js";
import AppError from "./utils/appError.js";
import { globalErrorHandler } from "./controllers/errors.controller.js";

// Routes
import toursRoute from "./routes/tours.route.js";
import usersRoute from "./routes/users.route.js";

process.on("uncaughtException", (error) => {
  console.log("Uncaught Exception! Shutting down...");
  console.log(error.name, error.message);

  process.exit(1);
});

const app = express();

// DB Connection
connectDB();

// Use extended query parser for bracketed query strings
// app.set("query parser", "extended");// does the same as QS but qs is more powerful for deeply nested params values

// -------------------------
// Important: Query Parser
// -------------------------
// Using `qs` here allows Express to parse bracketed query params like:
// GET /api/v1/tours?duration[gte]=5&difficulty=easy
// Without this, `req.query` would be:
// { 'duration[gte]': '5', difficulty: 'easy' }
// With `qs`, it becomes nested objects:
// { duration: { gte: '5' }, difficulty: 'easy' }
app.set("query parser", (str) => qs.parse(str));

// Middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Logs requests, usefull info in dev mode
}
app.use(express.json()); // Parsing JSON

app.use("/api/v1/tours", toursRoute);
app.use("/api/v1/users", usersRoute);

// 404 route handler
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

// Global Error handling middleware
// Express recognizses this as a error handling middleware automatically
// errors passed in next() will be automatically sent to this middleware, bypassing all other middleware in the stack
app.use(globalErrorHandler);

// Run Server
const PORT = process.env.PORT;
const server = app.listen(PORT, console.log(`App running on PORT ${PORT}...`));

// Error handlers that doesnt revolve around MongoDB or Express
process.on("unhandledRejection", (error) => {
  console.log("Unhandled Reject! Shutting down...");
  console.log(error.name, error.message);
  server.close(() => process.exit(1));
});

// process.on("uncaughtException", (error) => {
//   console.log("Uncaught Exception! Shutting down...");
//   console.log(error.name, error.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });

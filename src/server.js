import express from "express";
import morgan from "morgan";
import qs from "qs";
import { connectDB } from "./config/db.js";

// import path from "path";
// import { fileURLToPath } from "url";

// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// Routes
import toursRoute from "./routes/tours.route.js";
import usersRoute from "./routes/users.route.js";

// DB Connection
connectDB();

const app = express();

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
// app.use(express.static(`${__dirname}/public`));

app.use("/api/v1/tours", toursRoute);
app.use("/api/v1/users", usersRoute);

// Run Server
const PORT = process.env.PORT;
app.listen(PORT, console.log(`App running on PORT ${PORT}...`));

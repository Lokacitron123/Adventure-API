import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 100 requests per 1 hour
  max: 100, // Max 100 requests
  message: "Too many requests from this IP, please try again in an hour",
});

import APIFeatures from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import User from "../models/user.model.js";

export const getTourGuides = catchAsync(async (req, res, next) => {
  const tourGuides = await User.find({
    role: { $in: ["guide", "lead-guide"] },
  }).populate({
    path: "tours",
    select: "name", // pick only the fields you need
  });

  res.status(200).json({
    status: "success",
    results: tourGuides.length,
    data: tourGuides,
  });
});

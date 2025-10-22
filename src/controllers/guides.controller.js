import APIFeatures from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import User from "../models/user.model.js";
import Tour from "../models/tour.model.js";

export const getTourGuides = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    User.find({ role: { $in: ["guide", "lead-guide"] } }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tourGuides = await features.query.populate({
    path: "tours",
    select: "name",
  });

  res.status(200).json({
    status: "success",
    results: tourGuides.length,
    data: tourGuides,
  });
});

export const assignGuideToTour = catchAsync(async (req, res, next) => {
  const { tourId, guideId } = req.body;

  // Run both queries at the same time
  const [tour, guide] = await Promise.all([
    Tour.findById(tourId),
    User.findById(guideId),
  ]);

  if (!tour || !guide) {
    return next(new AppError("Tour or guide not found", 404));
  }

  if (!["guide", "lead-guide"].includes(guide.role)) {
    return next(new AppError("User is not a guide", 400));
  }

  tour.guides = tour.guides || [];
  guide.tours = guide.tours || [];

  // Add guide to tour
  if (!tour.guides.includes(guide._id)) {
    tour.guides.push(guide._id);
  }

  // Add tour to guide
  if (!guide.tours.includes(tour._id)) {
    guide.tours.push(tour._id);
  }

  // Save both at the same time
  await Promise.all([tour.save(), guide.save({ validateBeforeSave: false })]);

  res.status(200).json({
    status: "success",
    data: { tour },
  });
});

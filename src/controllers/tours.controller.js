import Tour from "../models/tour.model.js";
import APIFeatures from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

// Helpers
export function aliasTopTours(req, res, next) {
  // Define a custom query object for the "top-5-cheap" route.
  // These values simulate query string params like:
  //   ?limit=5&sort=-ratingAverage,price&fields=name,price,ratingAverage,summary,difficulty
  const forcedQuery = {
    limit: "5",
    sort: "-ratingAverage,price",
    fields: "name,price,ratingAverage,summary,difficulty",
  };

  /**
   * ⚠️ Important note:
   *
   * Normally in Express you can just do:
   *   req.query.limit = "5";
   *
   * But in this project we configured a custom query parser using `qs`:
   *   app.set("query parser", (str) => qs.parse(str));
   *
   * That makes `req.query` a *getter* (computed on every access) instead of a plain object.
   * - If the URL has no query string (like /top-5-cheap), qs.parse("") → {} each time.
   * - So any assignments to req.query (e.g., req.query.limit = "5") are lost.
   * - And trying to replace req.query directly (req.query = {...}) throws an error:
   *     "Cannot set property query of #<IncomingMessage> which has only a getter"
   *
   * ✅ Solution:
   * We override the `req.query` property definition entirely with our own fixed object.
   * That way, Express no longer tries to re-compute it from the URL,
   * and our pre-defined query values persist into the controller.
   */
  Object.defineProperty(req, "query", {
    value: forcedQuery,
    writable: false, // we don't need to change it later
  });

  console.log("Inside alias middleware, req.query = ", req.query);
  next();
}

// Controllers
export const getTours = catchAsync(async (req, res, next) => {
  // Build Query
  // // 1A) Filtering
  // const queryObj = { ...req.query };
  // const excludedFields = ["page", "sort", "limit", "fields"];
  // excludedFields.forEach((el) => delete queryObj[el]);

  // // 1B) Advanced Filtering
  // // Converts gte, gt, lte, lt to MongoDB operators $gte, $gt, etc.
  // // Example:
  // // { duration: { gte: '5' } }  --> { duration: { $gte: '5' } }
  // // Mongoose will automatically cast '5' (string) to number if schema defines it as Number
  // let queryStr = JSON.stringify(queryObj);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  // let query = Tour.find(JSON.parse(queryStr)); // use the transformed object

  // 2) Sorting
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(",").join(" ");
  //   query = query.sort(sortBy);
  // } else {
  //   query = query.sort("-createdAt");
  // }

  // 3) Limiting
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(",").join(" ");
  //   query = query.select("name duration difficulty price"); // Operation is called projecting when choosing specific fieldnames
  // } else {
  //   query = query.select("-__v"); // using - excluded whatever comes after it in select
  // }

  // 4) Pagination
  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 100;
  // const skip = (page - 1) * limit;

  // query = query.skip(skip).limit(limit);

  // if (req.query.page) {
  //   const numTours = await Tour.countDocuments();
  //   if (skip >= numTours) throw new Error("This page does not exist");
  // }

  // Execute Query
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  if (!tours || tours.length === 0) {
    return next(AppError("No tours found", 404));
  }

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
});

export const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.tourId);

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

export const postTour = catchAsync(async (req, res, next) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return next(new AppError("Tour data is missing", 400));
  }

  const newTour = await Tour.create({
    ...data,
  });

  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});

export const updateTour = catchAsync(async (req, res, next) => {
  const { tourId } = req;
  const updatedTour = await Tour.findByIdAndUpdate(tourId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedTour) {
    return res.status(404).json({
      status: "fail",
      message: `Tour with id ${tourId} not found`,
    });
  }
  res.status(200).json({
    status: "success",
    data: { updatedTour },
  });
});

export const deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.tourId);

  if (!tour) {
    return next("Tour with that id not found", 404);
  }

  await Tour.deleteOne(tour._id);
  res.status(201).json({
    status: "success",
    message: `Tour with ${tour._id} was successfully deleted`,
  });
});

// Aggregation Pipelines
export const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        // stage 1
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        // stage 2
        _id: { $toUpper: "$difficulty" },
        // _id: "$ratingsAverage",
        // _id: "$difficulty", // Adding field name instead of null groups data up. Example will give groups of data for each difficulty
        numTours: { $sum: 1 },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: {
        avgPrice: 1, // 1 = ascending
      },
    },
    // {
    //   $match: {
    //     _id: { $ne: "EASY" }, // Grab everything but the easy difficulty
    //   },
    // },
  ]);

  res.status(200).json({
    status: "success",
    data: { stats },
  });
});

export const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: {
          $sum: 1,
        },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: {
        month: "$_id",
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: { plan },
  });
});

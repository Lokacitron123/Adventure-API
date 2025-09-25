import express from "express";

import {
  getTours,
  getTour,
  postTour,
  updateTour,
  deleteTour,
  checkBody,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} from "../controllers/tours.controller.js";

const router = express.Router();

// param middleware
router.param("id", (req, res, next, val) => {
  if (!/^[a-fA-F0-9]{24}$/.test(val)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid ID format",
    });
  }

  req.tourId = val;
  next();
});

// Body Checker
// router.use("/", (req, res, next) => {
//   if (req.method === "POST" || req.method === "PATCH" || req.method === "PUT") {
//     return checkBody(req, res, next);
//   }
//   next();
// });

// Same as below
// router.get("/", getTours);
// router.get("/:id", getTour);
// router.put("/:id", putTour);
// router.post("/", postTour);
// router.delete("/:id", deleteTour);

router.route("/top-5-cheap").get(aliasTopTours, getTours);
router.route("/tour-stats").get(getTourStats);
router.route("/monthly-plan/:year").get(getMonthlyPlan);
router.route("/").get(getTours).post(postTour);
router.route("/:id").get(getTour).patch(updateTour).delete(deleteTour);

export default router;

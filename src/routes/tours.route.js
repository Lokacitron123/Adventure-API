import express from "express";

import {
  getTours,
  getTour,
  postTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} from "../controllers/tours.controller.js";
import {
  protectRoute,
  restrictTo,
} from "../controllers/authentication.controller.js";

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

router.route("/top-5-cheap").get(aliasTopTours, getTours);
router.route("/tour-stats").get(getTourStats);
router.route("/monthly-plan/:year").get(getMonthlyPlan);
router
  .route("/")
  .get(getTours)
  .post(protectRoute, restrictTo("lead-guide", "admin"), postTour);
router
  .route("/:id")
  .get(getTour)
  .patch(protectRoute, restrictTo("lead-guide", "admin"), updateTour)
  .delete(protectRoute, restrictTo("lead-guide", "admin"), deleteTour);

export default router;

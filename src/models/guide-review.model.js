import mongoose from "mongoose";

const { Schema, model } = mongoose;

const guideReviewSchema = new Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty"],
    },
    rating: {
      type: Number,
      min: [1, "Rating cant be lower than 1.0"],
      max: [5, "Rating cant be higher than 5.0"],
    },
    guide: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a guide"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must have an author"],
    },
  },
  {
    timestamps: true,
  }
);

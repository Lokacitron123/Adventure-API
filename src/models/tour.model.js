import mongoose from "mongoose";

const { Schema, model } = mongoose;

const tourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
    },
    duration: { type: Number, required: [true, "A tour must have a duration"] },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: ["easy", "medium", "difficult"],
    },
    ratingsAverage: { type: Number, default: 4.5, min: 1, max: 5 },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, "A tour must have a price"] },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    description: { type: String, trim: true },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    startDates: [Date],
  },
  { timestamps: true }
);

const Tour = model("Tour", tourSchema);

export default Tour;

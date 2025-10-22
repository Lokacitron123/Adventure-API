import mongoose from "mongoose";
import slugify from "slugify";
import validator from "validator";

const { Schema, model } = mongoose;

const tourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have less or equal than 40 characters"],
      minlength: [10, "A tour name must have more or equal than 10 characters"],
      validate: {
        validator: (val) => validator.isAlpha(val, "sv-SE", { ignore: " " }),
        message: "Name must only contain letters and spaces",
      },
    },
    slug: String,
    duration: { type: Number, required: [true, "A tour must have a duration"] },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty must be set to either easy, medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating cant be lower than 1.0"],
      max: [5, "Rating cant be higher than 5.0"],
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, "A tour must have a price"] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "Discount cant be higher or equal to the original price",
      },
    },
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
    secretTour: {
      type: Boolean,
      default: false,
    },
    // Refs guides
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: { virtuals: true },
  }
);

// Business logic
// Virtuals are information that isnt stored in the database but can be useful to be sent with the data stored in the DB to the client
// Important to know: virtuals cant be querried since they are not part of the database
// In this case, get the amount of weeks a tour lasts
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Document Middleware
// Pre runs before .save() and .create()
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

// tourSchema.pre("save", function (next) {
//   console.log("Will save document");

//   next();
// });

// // Post runs after
// tourSchema.post("save", function (doc, next) {
//   console.log("logging doc: ", doc);

//   next();
// });

// Querry Middleware
// With Querry Middleware the this keyword points at the querry, and not the document
// unlike the Document Middleware this-keyword above
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Querry took ${Date.now() - this.start} milliseconds!`);

//   console.log(docs);

//   next();
// });

// Aggregation Middleware
// Sorts out the secretTour = true tours
// Can be done inside the controllers too but doing it on the moddle level with middleware is more logical if we have to repeat ourselves
tourSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  next();
});

const Tour = model("Tour", tourSchema);

export default Tour;

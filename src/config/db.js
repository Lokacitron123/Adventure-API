import mongoose from "mongoose";
// export const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("DB connection successful!");
//   } catch (error) {
//     console.error("MongoDB connection failed ❌", error.message);
//     process.exit(1);
//   }
// };

export const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("DB connection successful!");
};

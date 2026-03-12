import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("MONGODB_URI:", uri);

    await mongoose.connect(uri as string);

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ Kết nối MongoDB thất bại", error);
  }
};

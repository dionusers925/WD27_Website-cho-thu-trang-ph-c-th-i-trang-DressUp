import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI); // kiểm tra biến môi trường

    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ Kết nối MongoDB thành công");
  } catch (error) {
    console.log("❌ Kết nối MongoDB thất bại", error);
  }
};

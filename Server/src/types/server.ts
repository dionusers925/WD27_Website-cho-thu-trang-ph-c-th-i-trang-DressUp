import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";

// routes
import userRoutes from "../routes/user";
import categoryRouter from "../routes/categories";
import orderRouter from "../routes/order";
import costumeRoutes from "../routes/costumes";
import cartRoutes from "../routes/cart";
import productRouter from "../routes/product";
import reviewRoutes from "../routes/review.route";
import authRoutes from "../routes/auth";
import paymentRoutes from "../routes/payment.routes";

const app = express();

// 🔥 CONNECT MONGODB
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/datn_wd27";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Kết nối MongoDB thành công"))
  .catch((err) => console.error("❌ Lỗi MongoDB:", err));

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/users", userRoutes);
app.use("/categories", categoryRouter);
app.use("/orders", orderRouter);
app.use("/products", productRouter);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payment", paymentRoutes);

app.use("/api", costumeRoutes);
app.use("/api", cartRoutes);
app.use("/api/auth", authRoutes);

// test API
app.get("/", (req, res) => {
  res.send("API is running...");
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
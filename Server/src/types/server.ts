import express from "express";
import { connectDB } from "./db";
import userRoutes from "../routes/user";
import "dotenv/config";
import cors from "cors";
import categoryRouter from "../routes/categories";
import orderRouter from "../routes/order";
// 1. Import router sản phẩm của bạn vào đây
import productRouter from "../routes/product"; 

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/categories", categoryRouter);
app.use("/orders", orderRouter);
// 2. PHẢI CÓ DÒNG NÀY thì Frontend mới lấy được sản phẩm
app.use("/products", productRouter); 

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
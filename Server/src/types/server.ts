import express from "express";
import { connectDB } from "./db";
import userRoutes from "../routes/user";
import "dotenv/config";
import cors from "cors";
import categoryRouter from "../routes/categories";
import orderRouter from "../routes/order";

import productRouter from "../routes/product"; 

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/categories", categoryRouter);
app.use("/orders", orderRouter);
app.use("/products", productRouter); 

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
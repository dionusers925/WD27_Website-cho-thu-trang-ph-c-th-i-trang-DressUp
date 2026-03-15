import express from "express";
import { connectDB } from "./db";
import userRoutes from "../routes/user";
import "dotenv/config";
import cors from "cors";
import categoryRouter from "../routes/categories";
import attributeRouter from "../routes/attributes";
import productRoutes from "../routes/products";
<<<<<<< HEAD
import orderRouter from "../routes/order";
=======
>>>>>>> c48e5aef6fbe32aa5c5d0ca3514c99b2e8493df4
const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/users", userRoutes);
app.use("/categories", categoryRouter);
app.use("/attributes", attributeRouter);
app.use("/api/products", productRoutes);
<<<<<<< HEAD
app.use("/orders", orderRouter);
=======
>>>>>>> c48e5aef6fbe32aa5c5d0ca3514c99b2e8493df4
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});

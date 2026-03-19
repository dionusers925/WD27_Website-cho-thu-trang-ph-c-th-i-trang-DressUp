import express from "express";
import { connectDB } from "./db";
import userRoutes from "../routes/user";
import "dotenv/config";
import cors from "cors";
import categoryRouter from "../routes/categories";
import orderRouter from "../routes/order";
import costumeRoutes from "../routes/costumes";
import cartRoutes from "../routes/cart";
import productRouter from "../routes/product";
import productRoutes from "../routes/products";
import reviewRoutes from "../routes/review.route";
import attributeRouter from "../routes/attributes";

const app = express();

connectDB();

app.use(cors());
// Increase payload limit to support rich-text content with embedded images/base64
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/users", userRoutes);
app.use("/categories", categoryRouter);
app.use("/orders", orderRouter);
app.use("/products", productRouter);
app.use("/api/products", productRoutes);
app.use("/attributes", attributeRouter);
app.use("/api/reviews", reviewRoutes);

app.use("/api", costumeRoutes);
app.use("/api", cartRoutes);

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});

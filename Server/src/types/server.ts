import express from "express";
import path from "path";
import { connectDB } from "./db";

import "dotenv/config";
import cors from "cors";

// routes
import userRoutes from "../routes/user";
import categoryRouter from "../routes/categories";
import orderRouter from "../routes/order";
import costumeRoutes from "../routes/costumes";
import cartRoutes from "../routes/cart";
import productRouter from "../routes/product";
import productRoutes from "../routes/products";
import reviewRoutes from "../routes/review.route";
import authRoutes from "../routes/auth";
import paymentRoutes from "../routes/payment.routes";
import attributeRouter from "../routes/attributes";
import uploadRouter from "../routes/upload";
import stockHistoryRouter from "../routes/stockHistory";

const app = express();

connectDB();

// middleware
app.use(cors());
// Increase payload limit to support rich-text content with embedded images/base64
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.resolve("uploads")));

// routes
app.use("/users", userRoutes);
app.use("/categories", categoryRouter);
app.use("/orders", orderRouter);
app.use("/products", productRouter);
app.use("/api/products", productRoutes);
app.use("/attributes", attributeRouter);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api", stockHistoryRouter);
app.use(uploadRouter);
app.use("/api", costumeRoutes);
app.use("/api", cartRoutes);
app.use("/api/auth", authRoutes);

app.listen(3000, () => {
  console.log("?? Server running on port 3000");
});

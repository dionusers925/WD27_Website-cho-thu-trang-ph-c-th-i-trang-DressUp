import express from "express";
import { Order } from "../models/Order";

const orderRouter = express.Router();

// Lấy danh sách đơn hàng
orderRouter.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("items.productId", "name price")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
});

orderRouter.post("/", async (req, res) => {
  try {
    const { userId, total, paymentMethod, items, startDate, endDate } =
      req.body;

    const newOrder = new Order({
      userId,
      total,
      paymentMethod: paymentMethod || "cash",
      // Tạo mã đơn hàng ngẫu nhiên
      orderNumber: `DU${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      status: "pending",
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      items: items || [],
      shippingAddress: { address: "Tại quầy", city: "Tại quầy" },
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Lỗi Backend:", error);
    res.status(400).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
});

export default orderRouter;
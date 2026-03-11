import express from "express";
import { Order } from "../models/Order"; // Đảm bảo tên Model khớp với "orders" trong DB

const orderRouter = express.Router();

// Lấy danh sách đơn hàng
orderRouter.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email") // Lấy thêm tên khách hàng
      .sort({ createdAt: -1 }); // Đơn mới nhất lên đầu
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
});

export default orderRouter;
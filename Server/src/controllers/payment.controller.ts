import { Request, Response } from "express";
import Order from "../models/Order";
import { createVnpayUrl } from "../services/vnpay.service";

export const checkout = async (req: Request, res: Response) => {
  try {
    // DEBUG
    console.log("BODY:", req.body);

    const { userId, total, items } = req.body;

    // CHECK userId
    if (!userId) {
      return res.status(400).json({
        message: "Thiếu userId",
      });
    }

    // CHECK items
    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Giỏ hàng trống",
      });
    }

    const order = await Order.create({
  userId: userId,
  total: total,
  items: items,
  status: "pending",
  orderNumber: `DU${new Date().getFullYear()}${Math.floor(
    1000 + Math.random() * 9000
  )}`,
});

    // TẠO LINK VNPAY
    const paymentUrl = createVnpayUrl(
      total,
      order._id.toString(),
      req.ip || "127.0.0.1"
    );

    return res.json({
      message: "Tạo thanh toán thành công",
      paymentUrl,
    });
  } catch (error) {
    console.error("Lỗi checkout:", error);
    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};
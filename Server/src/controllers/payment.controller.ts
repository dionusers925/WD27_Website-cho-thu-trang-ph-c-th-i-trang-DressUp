import { Request, Response } from "express";
import Order from "../models/Order";
import { createVnpayUrl } from "../services/vnpay.service";

export const checkout = async (req: Request, res: Response) => {
  try {
    console.log("BODY:", req.body);

    const { userId, total, items } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        message: "Thiếu userId",
      });
    }

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Giỏ hàng trống",
      });
    }

    // Validate total
    if (!total || total <= 0) {
      return res.status(400).json({
        message: "Số tiền không hợp lệ",
      });
    }

    // Tạo order
    const order = await Order.create({
      userId: userId,
      total: total,
      items: items,
      status: "pending",
      orderNumber: `DU${Date.now()}`
    });

    console.log("ORDER CREATED:", {
      id: order._id,
      orderNumber: order.orderNumber,
      total: order.total
    });

    // Lấy IP client đúng cách
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';

    // Tạo link VNPAY
    const paymentUrl = createVnpayUrl(
      total,
      order,
      clientIp
    );

    console.log("PAYMENT URL CREATED:", paymentUrl);

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
import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import Cart from "../models/Cart";
import { createVnpayUrl } from "../services/vnpay.service";

// Lưu tạm thông tin thanh toán
const tempPayments: any = {};

// 1. API tạo link thanh toán (KHÔNG tạo order)
export const createPaymentUrl = async (req: Request, res: Response) => {
  try {
    console.log("BODY createPaymentUrl:", req.body);

    const { userId, total, items, customerInfo, paymentMethod, bankName, bankAccount, bankHolder } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ message: "Số tiền không hợp lệ" });
    }
    

    const tempOrderNumber = `TMP${Date.now()}`;

    tempPayments[tempOrderNumber] = {
      userId,
      total,
      items,
      customerInfo,
      bankName,
      bankAccount,
      bankHolder,
      createdAt: new Date(),
      processed: false,
      paymentMethod: paymentMethod || "vnpay",
    };

    const fakeOrder = {
      _id: tempOrderNumber,
      orderNumber: tempOrderNumber,
      total: total,
    };

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';
    const paymentUrl = createVnpayUrl(total, fakeOrder, clientIp);

    console.log("PAYMENT URL CREATED:", paymentUrl);

    return res.json({
      message: "Tạo link thanh toán thành công",
      paymentUrl,
      tempOrderNumber,
    });
  } catch (error) {
    console.error("Lỗi tạo payment URL:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// 2. API xử lý sau khi thanh toán thành công
export const paymentSuccess = async (req: Request, res: Response) => {
  try {
    console.log("BODY paymentSuccess:", req.body);

    const { vnp_TxnRef, vnp_ResponseCode, vnp_Amount, vnp_TransactionNo } = req.body;

    if (vnp_ResponseCode !== "00") {
      return res.status(400).json({ success: false, message: "Thanh toán thất bại" });
    }

    const tempData = tempPayments[vnp_TxnRef];
    if (!tempData) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin thanh toán" });
    }

    if (tempData.processed) {
      console.log("Đơn hàng đã được xử lý trước đó:", vnp_TxnRef);
      return res.json({ success: true, message: "Đơn hàng đã được xử lý", alreadyProcessed: true });
    }

    tempPayments[vnp_TxnRef].processed = true;

    const formattedItems = tempData.items.map((item: any) => ({
      productId: item.productId,
      name: item.name,
      size: item.size,
      color: item.color,
      deposit: item.deposit || 0,
      quantity: item.quantity,
      price: item.price,
    }));

    // Tạo order
    const order = await Order.create({
      userId: tempData.userId,
      orderNumber: `DH${Date.now()}`,
      items: formattedItems,
      subtotal: tempData.total,
      serviceFee: 0,
      total: tempData.total,
      paymentMethod: tempData.paymentMethod || "vnpay",
      paymentStatus: "paid",
      status: "confirmed",
      customerName: tempData.customerInfo?.fullName || "",
      customerPhone: tempData.customerInfo?.phone || "",
      customerAddress: tempData.customerInfo?.address || "",
      bankName: tempData.bankName || "",
      bankAccount: tempData.bankAccount || "",
      bankHolder: tempData.bankHolder || "",
      note: tempData.customerInfo?.note || "",
      vnpTransactionNo: vnp_TransactionNo,
    });

    console.log("ORDER CREATED:", {
      id: (order as any)._id,
      orderNumber: (order as any).orderNumber,
    });

    delete tempPayments[vnp_TxnRef];

    return res.json({
      success: true,
      message: "Thanh toán thành công",
      order: order,
    });
  } catch (error) {
    console.error("Lỗi xử lý thanh toán thành công:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const checkout = async (req: Request, res: Response) => {
  return res.status(404).json({ message: "API đã được thay thế, vui lòng dùng /create-payment-url" });
};
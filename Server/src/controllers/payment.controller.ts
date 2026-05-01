import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import Cart from "../models/Cart";
import Product from "../models/Product";
import Variant from "../models/variant.model";
import { createVnpayUrl } from "../services/vnpay.service";

const calcRentalDays = (start: Date, end: Date) => {
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

// Lưu tạm thông tin thanh toán
const tempPayments: any = {};
const tempExtendPayments: any = {}; 

// 1. API tạo link thanh toán
export const createPaymentUrl = async (req: Request, res: Response) => {
  try {
    const { 
      userId, total, subtotal, shippingFee, items, customerInfo, 
      returnAddress, bankName, bankAccount, bankHolder, paymentMethod 
    } = req.body;

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
      subtotal,
      shippingFee,
      items,
      customerInfo,
      returnAddress,
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
  } catch (error: any) {
    console.error("Lỗi tạo payment URL:", error);
    const message = error?.message || "Lỗi server";
    return res.status(500).json({ message });
  }
};

// 2. API xử lý sau khi thanh toán thành công
export const paymentSuccess = async (req: Request, res: Response) => {
  try {
    const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo } = req.body;

    if (vnp_ResponseCode !== "00") {
      return res.status(400).json({ success: false, message: "Thanh toán thất bại" });
    }

    // Kiểm tra xem có phải thanh toán gia hạn không
    if (vnp_TxnRef.startsWith("EXT")) {
      const extendData = tempExtendPayments[vnp_TxnRef];
      if (!extendData) {
        return res.status(404).json({ success: false, message: "Không tìm thấy thông tin thanh toán gia hạn" });
      }

      if (extendData.processed) {
        return res.json({ success: true, message: "Đã xử lý", alreadyProcessed: true });
      }

      tempExtendPayments[vnp_TxnRef].processed = true;

      // Gọi API xác nhận gia hạn
      const confirmResponse = await fetch(`http://localhost:3000/orders/confirm-extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: extendData.requestId,
          vnp_ResponseCode: "00"
        })
      });

      const result = await confirmResponse.json();
      
      delete tempExtendPayments[vnp_TxnRef];

      return res.json({
        success: true,
        message: result.message || "Gia hạn thành công",
        order: result.order
      });
    }

    // Thanh toán đơn hàng thông thường
    const tempData = tempPayments[vnp_TxnRef];
    if (!tempData) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin thanh toán" });
    }

    if (tempData.processed) {
      console.log("Đơn hàng đã được xử lý trước đó:", vnp_TxnRef);
      return res.json({ success: true, message: "Đơn hàng đã được xử lý", alreadyProcessed: true });
    }

    tempPayments[vnp_TxnRef].processed = true;

    // Format items theo đúng cấu trúc Order model mới
    const formattedItems = tempData.items.map((item: any) => {
      const startDate = item.startDate ? new Date(item.startDate) : new Date();
      const endDate = item.endDate ? new Date(item.endDate) : new Date();
      const days = calcRentalDays(startDate, endDate);
      const pricePerDay = item.price || item.rentalPrice || 0;
      const lineTotal = pricePerDay * days * (item.quantity || 1);
      
      return {
        productId: new mongoose.Types.ObjectId(item.productId),
        name: item.name,
        image: item.image || "",
        rental: {
          startDate: startDate,
          endDate: endDate,
          days: days,
          pricePerDay: pricePerDay
        },
        variant: {
          size: item.size || "M",
          color: item.color || "Đen"
        },
        deposit: item.deposit || 0,
        quantity: item.quantity || 1,
        lineTotal: lineTotal
      };
    });

    // Tính toán lại các tổng
    interface FormattedItem {
      lineTotal: number;
      deposit: number;
      quantity: number;
    }

    const subtotal = formattedItems.reduce((sum: number, item: FormattedItem) => sum + item.lineTotal, 0);
    const totalDeposit = formattedItems.reduce((sum: number, item: FormattedItem) => sum + (item.deposit * item.quantity), 0);
    const total = subtotal + totalDeposit + (tempData.shippingFee || 0);

    // Tạo order với cấu trúc mới
    const order = await Order.create({
      userId: new mongoose.Types.ObjectId(tempData.userId),
      orderNumber: `DH${Date.now()}`,
      items: formattedItems,
      customerInfo: tempData.customerInfo,
      shippingAddress: {
        receiverName: tempData.customerInfo?.fullName || "",
        receiverPhone: tempData.customerInfo?.phone || "",
        line1: tempData.customerInfo?.address || "",
        ward: "",
        district: "",
        province: "Hà Nội",
        country: "VN"
      },
      subtotal: subtotal,
      discount: 0,
      shippingFee: tempData.shippingFee || 0,
      serviceFee: 0,
      couponDiscount: 0,
      totalDeposit: totalDeposit,
      total: total,
      paymentMethod: tempData.paymentMethod || "vnpay",
      paymentStatus: "paid",
      status: "confirmed",
      statusHistory: [{
        status: "confirmed",
        timestamp: new Date(),
        changedBy: tempData.userId,
        notes: "Thanh toán VNPay thành công"
      }],
      notes: tempData.customerInfo?.note || "",
      pickupDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lateFee: 0,
      vnpTransactionNo: vnp_TransactionNo
    }) as any;

    console.log("✅ ORDER CREATED:", {
      id: order._id,
      orderNumber: order.orderNumber,
      items: formattedItems.map((i: any) => ({
        name: i.name,
        startDate: i.rental.startDate,
        endDate: i.rental.endDate,
        days: i.rental.days
      }))
    });

    // ========== TRỪ STOCK (CHO MODEL VARIANT) ==========
    for (const item of formattedItems) {
      try {
        // Tìm variant theo productId, size, color
        const variant = await Variant.findOne({
          productId: item.productId,
          size: item.variant.size,
          color: item.variant.color
        });
        
        if (!variant) {
          console.warn(`⚠️ Không tìm thấy biến thể: ${item.name} - Size: ${item.variant.size}, Color: ${item.variant.color}`);
          continue;
        }
        
        const oldStock = variant.stock || 0;
        if (oldStock >= item.quantity) {
          variant.stock = oldStock - item.quantity;
          await variant.save();
          console.log(`✅ Đã trừ stock: ${item.name} (${variant.size}/${variant.color}) - ${oldStock} → ${variant.stock}`);
        } else {
          console.error(`❌ Không đủ stock: ${item.name} (${variant.size}/${variant.color}) - chỉ còn ${oldStock}, cần ${item.quantity}`);
        }
      } catch (stockError) {
        console.error(`❌ Lỗi trừ stock cho ${item.name}:`, stockError);
      }
    }
    console.log("✅ Đã hoàn tất cập nhật tồn kho");

    // Xóa giỏ hàng sau khi tạo order thành công
    try {
      await Cart.findOneAndDelete({ user: new mongoose.Types.ObjectId(tempData.userId) });
      console.log("✅ Đã xóa giỏ hàng sau khi thanh toán");
    } catch (cartError) {
      console.error("Lỗi xóa giỏ hàng:", cartError);
    }

    delete tempPayments[vnp_TxnRef];

    return res.json({
      success: true,
      message: "Thanh toán thành công",
      order: order,
    });
  } catch (error) {
    console.error("Lỗi xử lý thanh toán thành công:", error);
    return res.status(500).json({ success: false, message: "Lỗi server: " + String(error) });
  }
};

// ==================== API TẠO LINK THANH TOÁN CHO GIA HẠN ====================
export const createExtendPaymentUrl = async (req: Request, res: Response) => {
  try {
    const { requestId, amount, userId } = req.body;

    if (!requestId || !amount || !userId) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    const tempOrderNumber = `EXT${Date.now()}`;
    
    // Lưu tạm thông tin gia hạn
    tempExtendPayments[tempOrderNumber] = {
      type: "extend",
      requestId,
      userId,
      amount,
      createdAt: new Date(),
      processed: false
    };

    const fakeOrder = {
      _id: tempOrderNumber,
      orderNumber: tempOrderNumber,
      total: amount
    };

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';
    const paymentUrl = createVnpayUrl(amount, fakeOrder, clientIp);

    return res.json({
      message: "Tạo link thanh toán thành công",
      paymentUrl,
      tempOrderNumber
    });
  } catch (error: any) {
    console.error("Lỗi tạo payment URL gia hạn:", error);
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
};

export const checkout = async (req: Request, res: Response) => {
  return res.status(404).json({ message: "API đã được thay thế, vui lòng dùng /create-payment-url" });
};
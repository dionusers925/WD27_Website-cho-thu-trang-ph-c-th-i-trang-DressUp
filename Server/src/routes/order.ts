import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order";

const orderRouter = express.Router();

const calcRentalDays = (start: Date, end: Date) => {
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

// Lấy danh sách đơn hàng (admin)
orderRouter.get("/", async (_req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name fullName email phone")
      .populate("items.productId", "name price images")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
});

// Lấy lịch sử đơn hàng của user
orderRouter.get("/my-orders", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }
    
    const orders = await Order.find({ userId: userId })
      .populate("items.productId", "name images price")
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error("Lỗi lấy lịch sử đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// API trả đồ
orderRouter.post("/:id/return", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
    }

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const order = await Order.findOne({ _id: id, userId: userId });
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ 
        message: "Chỉ có thể trả đồ khi đơn hàng đã được giao" 
      });
    }

    order.status = "returning";
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: "returning",
      date: new Date(),
      updatedBy: "Khách hàng",
    });

    await order.save();

    res.json({ 
      success: true, 
      message: "Đã gửi yêu cầu trả đồ thành công", 
      order 
    });
  } catch (error) {
    console.error("Lỗi trả đồ:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Lấy chi tiết đơn hàng
orderRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
    }

    const order = await Order.findById(id)
      .populate("userId", "name fullName email phone")
      .populate("items.productId", "name price images");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
});

// Tạo đơn hàng mới
orderRouter.post("/", async (req, res) => {
  try {
    const {
      userId,
      total,
      paymentMethod,
      items,
      startDate,
      endDate,
      customerName,
      customerPhone,
      customerAddress,
      bankName,
      bankAccount,
      bankHolder,
      note,
      status,
      vnpTransactionNo, 
    } = req.body;

    const demoUserId = "65c000000000000000000001";
    const resolvedUserId = mongoose.Types.ObjectId.isValid(String(userId ?? ""))
      ? userId
      : demoUserId;

    const normalizedItems = Array.isArray(items)
      ? items
        .map((item: any) => ({
          productId: item?.productId,
          name: item?.name ? String(item.name) : undefined,
          size: item?.size ? String(item.size) : undefined,
          color: item?.color ? String(item.color) : undefined,
          deposit: Number(item?.deposit ?? 0) || 0,
          quantity: Number(item?.quantity ?? 1) || 1,
          price: Number(item?.price ?? 0) || 0,
        }))
        .filter((item: any) => item.productId)
      : [];

    if (normalizedItems.length === 0) {
      return res.status(400).json({ message: "Đơn hàng phải có ít nhất 1 sản phẩm." });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : start;
    const rentalDays = calcRentalDays(start, end);

    const rentalSubtotal = normalizedItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity * rentalDays,
      0
    );
    const depositTotal = normalizedItems.reduce(
      (sum: number, item: any) => sum + item.deposit * item.quantity,
      0
    );
    const computedTotal = rentalSubtotal + depositTotal;

    const orderTotal = Number(total);
    const finalTotal = Number.isFinite(orderTotal) && orderTotal > 0 ? orderTotal : computedTotal;

    const newOrder = new Order({
      userId: resolvedUserId,
      total: finalTotal,
      subtotal: rentalSubtotal,
      paymentMethod: paymentMethod || "cash",
      orderNumber: `DU${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      status: status || "pending",
      startDate: start,
      endDate: end,
      items: normalizedItems,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerAddress: customerAddress || undefined,
      bankName: bankName || undefined,
      bankAccount: bankAccount || undefined,
      bankHolder: bankHolder || undefined,
      note: note || undefined,
      vnpTransactionNo: vnpTransactionNo || undefined, 
      shippingAddress: {
        name: paymentMethod === "vnpay" ? (customerName || "Khách online") : "Khách tại quầy",
        phone: paymentMethod === "vnpay" ? (customerPhone || undefined) : undefined,
        address: paymentMethod === "vnpay" ? (customerAddress || "Không có địa chỉ") : "Tại quầy",
        city: paymentMethod === "vnpay" ? "Online" : "Tại quầy",
      },
      statusHistory: [{
        status: status || "pending",
        date: new Date(),
        updatedBy: "Hệ thống / Người dùng",
      }],
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Lỗi Backend:", error);
    res.status(400).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
});

orderRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { lateFee, damageFee, status, paymentStatus, overdueDays, damageErrors, lostItems, updatedBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const updateQuery: any = {
      $set: {
        lateFee: Number(lateFee) || 0,
        damageFee: Number(damageFee) || 0,
        status: status || currentOrder.status,
        paymentStatus: paymentStatus || currentOrder.paymentStatus,
        overdueDays: overdueDays !== undefined ? Number(overdueDays) : undefined,
        damageErrors: Array.isArray(damageErrors) ? damageErrors : undefined,
        lostItems: Array.isArray(lostItems) ? lostItems : undefined,
      }
    };

    if (status && currentOrder.status !== status) {
      updateQuery.$push = {
        statusHistory: {
          status,
          date: new Date(),
          updatedBy: updatedBy || "Hệ thống",
        }
      };
    }

    if (paymentStatus && currentOrder.paymentStatus !== paymentStatus) {
      updateQuery.$push = {
        ...(updateQuery.$push || {}),
        paymentStatusHistory: {
          status: paymentStatus,
          date: new Date(),
          updatedBy: updatedBy || "Hệ thống",
        }
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateQuery, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server khi cập nhật" });
  }
});

// ==================== API GIA HẠN / RÚT NGẮN THUÊ ====================
// ==================== API GIA HẠN / RÚT NGẮN THUÊ ====================
orderRouter.post("/:id/extend", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, newEndDate } = req.body;

    console.log("📥 Received:", { id, userId, newEndDate });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
    }

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const order = await Order.findOne({ _id: id, userId: userId });
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const allowedStatuses = ["confirmed", "shipped", "delivered", "renting"];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        message: "Chỉ có thể thay đổi thời gian thuê khi đơn hàng đang trong quá trình thuê",
      });
    }

    // Parse ngày mới
    const newEndDateObj = new Date(newEndDate);
    const currentStartDate = order.startDate ? new Date(order.startDate) : new Date();
    const currentEndDate = order.endDate ? new Date(order.endDate) : new Date();

    console.log("📅 Dates:", {
      newEndDateObj,
      currentStartDate,
      currentEndDate,
    });

    // Kiểm tra ngày hợp lệ
    if (isNaN(newEndDateObj.getTime())) {
      return res.status(400).json({ message: "Ngày kết thúc không hợp lệ" });
    }

    if (newEndDateObj <= currentStartDate) {
      return res.status(400).json({ 
        message: `Ngày kết thúc phải sau ngày bắt đầu (${currentStartDate.toLocaleDateString("vi-VN")})` 
      });
    }

    // 👉 BỎ KIỂM TRA newEndDateObj <= currentEndDate
    // Để cho phép cả rút ngắn (chọn ngày sớm hơn)

    // Tính số ngày thay đổi
    const oldRentalDays = calcRentalDays(currentStartDate, currentEndDate);
    const newRentalDays = calcRentalDays(currentStartDate, newEndDateObj);
    const daysChanged = newRentalDays - oldRentalDays;

    // Tính tiền
    const rentalSubtotal = (order.items || []).reduce(
      (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );
    const dailyRate = rentalSubtotal / oldRentalDays;
    
    let message = "";
    let newTotal = order.total;

    if (daysChanged > 0) {
      // Gia hạn
      const additionalRental = dailyRate * daysChanged;
      newTotal = order.total + additionalRental;
      message = `Đã gia hạn thêm ${daysChanged} ngày. Vui lòng thanh toán thêm ${additionalRental.toLocaleString()}đ`;
    } else if (daysChanged < 0) {
      // Rút ngắn
      const refundAmount = dailyRate * Math.abs(daysChanged);
      newTotal = order.total - refundAmount;
      message = `Đã rút ngắn ${Math.abs(daysChanged)} ngày. Số tiền hoàn: ${refundAmount.toLocaleString()}đ sẽ được chuyển vào tài khoản ngân hàng của bạn`;
    } else {
      return res.status(400).json({ message: "Ngày kết thúc mới trùng với ngày hiện tại" });
    }

    // Cập nhật order
    order.endDate = newEndDateObj;
    order.total = newTotal;
    
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: daysChanged > 0 ? "extended" : "shortened",
      date: new Date(),
      updatedBy: "Khách hàng",
      note: message,
    });

    await order.save();

    res.json({
      success: true,
      message,
      order,
      additionalPayment: daysChanged > 0 ? dailyRate * daysChanged : 0,
      refundAmount: daysChanged < 0 ? dailyRate * Math.abs(daysChanged) : 0,
    });
  } catch (error) {
    console.error("Lỗi thay đổi thời gian thuê:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default orderRouter;
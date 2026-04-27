import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order";

const orderRouter = express.Router();

// Map tạm lưu yêu cầu gia hạn (chờ thanh toán)
const extendRequests = new Map<string, any>();

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

    if (order.status !== "delivered" && order.status !== "renting") {
      return res.status(400).json({ 
        message: "Chỉ có thể trả đồ khi đơn hàng đã được giao hoặc đang thuê" 
      });
    }

    order.status = "returning";
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: "returning",
      timestamp: new Date(),
      changedBy: "Khách hàng",
      notes: "Khách hàng yêu cầu trả đồ",
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
      ? items.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          image: item.image || "",
          rental: {
            startDate: new Date(item.startDate || item.rental?.startDate || new Date()),
            endDate: new Date(item.endDate || item.rental?.endDate || new Date()),
            days: item.days || item.rental?.days || 1,
            pricePerDay: item.price || item.rental?.pricePerDay || 0,
          },
          variant: {
            size: item.size || "M",
            color: item.color || "Đen",
          },
          deposit: item.deposit || 0,
          quantity: item.quantity || 1,
          lineTotal: (item.price || 0) * (item.days || 1) * (item.quantity || 1),
        }))
      : [];

    if (normalizedItems.length === 0) {
      return res.status(400).json({ message: "Đơn hàng phải có ít nhất 1 sản phẩm." });
    }

    const rentalSubtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalDeposit = normalizedItems.reduce((sum, item) => sum + (item.deposit * item.quantity), 0);
    const finalTotal = total || (rentalSubtotal + totalDeposit);

    const newOrder = new Order({
      userId: resolvedUserId,
      orderNumber: `DU${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      items: normalizedItems,
      subtotal: rentalSubtotal,
      discount: 0,
      shippingFee: 0,
      serviceFee: 0,
      couponDiscount: 0,
      totalDeposit: totalDeposit,
      total: finalTotal,
      paymentMethod: paymentMethod || "cash",
      paymentStatus: "pending",
      status: status || "pending",
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerAddress: customerAddress || undefined,
      bankName: bankName || undefined,
      bankAccount: bankAccount || undefined,
      bankHolder: bankHolder || undefined,
      notes: note || undefined,
      vnpTransactionNo: vnpTransactionNo || undefined,
      shippingAddress: {
        receiverName: customerName || "Khách hàng",
        receiverPhone: customerPhone || "",
        line1: customerAddress || "",
        province: "Hà Nội",
        country: "VN",
      },
      statusHistory: [{
        status: status || "pending",
        timestamp: new Date(),
        changedBy: resolvedUserId,
        notes: "Đơn hàng được tạo",
      }],
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Lỗi Backend:", error);
    res.status(400).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
});

// Cập nhật đơn hàng
orderRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      lateFee, damageFee, status, paymentStatus, overdueDays, 
      damageErrors, lostItems, updatedBy, returnMedia, 
      adminReturnMedia, penaltyNote 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const updateData: any = {};
    if (lateFee !== undefined) updateData.lateFee = lateFee;
    if (damageFee !== undefined) updateData.damageFee = damageFee;
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (overdueDays !== undefined) updateData.overdueDays = overdueDays;
    if (damageErrors !== undefined) updateData.damageErrors = damageErrors;
    if (lostItems !== undefined) updateData.lostItems = lostItems;
    if (returnMedia !== undefined) updateData.returnMedia = returnMedia;
    if (adminReturnMedia !== undefined) updateData.adminReturnMedia = adminReturnMedia;
    if (penaltyNote !== undefined) updateData.penaltyNote = penaltyNote;

    if (status && currentOrder.status !== status) {
      updateData.$push = {
        statusHistory: {
          status,
          timestamp: new Date(),
          changedBy: updatedBy || "Hệ thống",
          notes: req.body.note || "",
        }
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi Server khi cập nhật" });
  }
});

// ==================== API GIA HẠN / RÚT NGẮN THUÊ ====================
orderRouter.post("/:id/extend", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, newEndDate } = req.body;

    console.log("📥 Received extend request:", { id, userId, newEndDate });

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

    const firstItem = order.items[0];
    if (!firstItem || !firstItem.rental) {
      return res.status(400).json({ message: "Không tìm thấy thông tin ngày thuê" });
    }

    const currentStartDate = firstItem.rental.startDate;
    const currentEndDate = firstItem.rental.endDate;
    const newEndDateObj = new Date(newEndDate);
    const oldRentalDays = firstItem.rental.days;

    console.log("📅 Current rental:", {
      startDate: currentStartDate,
      endDate: currentEndDate,
      days: oldRentalDays,
    });
    console.log("📅 New end date:", newEndDateObj);

    if (isNaN(newEndDateObj.getTime())) {
      return res.status(400).json({ message: "Ngày kết thúc không hợp lệ" });
    }

    if (newEndDateObj <= currentStartDate) {
      return res.status(400).json({ 
        message: `Ngày kết thúc phải sau ngày bắt đầu (${new Date(currentStartDate).toLocaleDateString("vi-VN")})` 
      });
    }

    const diffTime = newEndDateObj.getTime() - new Date(currentStartDate).getTime();
    const newRentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const daysChanged = newRentalDays - oldRentalDays;

    if (daysChanged === 0) {
      return res.status(400).json({ message: "Ngày kết thúc mới trùng với ngày hiện tại" });
    }

    // Tính số tiền cần thanh toán thêm
    let additionalTotal = 0;
    order.items.forEach((item: any) => {
      const pricePerDay = item.rental.pricePerDay;
      const additional = pricePerDay * daysChanged * item.quantity;
      additionalTotal += additional;
    });

    // Lưu tạm yêu cầu gia hạn
    const extendRequest = {
      orderId: id,
      userId,
      newEndDate: newEndDateObj,
      newRentalDays,
      daysChanged,
      additionalTotal,
      createdAt: new Date()
    };
    
    const requestId = `EXT${Date.now()}`;
    extendRequests.set(requestId, extendRequest);

    // Trả về thông tin để FE tạo thanh toán
    return res.json({
      success: true,
      needPayment: daysChanged > 0,
      requestId,
      additionalPayment: additionalTotal,
      daysChanged: Math.abs(daysChanged),
      message: daysChanged > 0 
        ? `Bạn muốn gia hạn thêm ${daysChanged} ngày với số tiền ${additionalTotal.toLocaleString()}đ. Vui lòng thanh toán để hoàn tất.`
        : `Bạn muốn rút ngắn ${Math.abs(daysChanged)} ngày. Số tiền hoàn: ${Math.abs(additionalTotal).toLocaleString()}đ.`
    });

  } catch (error) {
    console.error("Lỗi gia hạn:", error);
    res.status(500).json({ message: "Lỗi server: " + String(error) });
  }
});

// API xác nhận gia hạn sau khi thanh toán thành công
orderRouter.post("/confirm-extend", async (req, res) => {
  try {
    const { requestId, vnp_ResponseCode } = req.body;

    if (vnp_ResponseCode !== "00") {
      return res.status(400).json({ success: false, message: "Thanh toán thất bại" });
    }

    const extendRequest = extendRequests.get(requestId);
    if (!extendRequest) {
      return res.status(404).json({ success: false, message: "Yêu cầu không hợp lệ hoặc đã hết hạn" });
    }

    const order = await Order.findById(extendRequest.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // Cập nhật order với thông tin gia hạn
    order.items.forEach((item: any) => {
      const additional = item.rental.pricePerDay * extendRequest.daysChanged * item.quantity;
      item.lineTotal = (item.lineTotal || 0) + additional;
      item.rental.endDate = extendRequest.newEndDate;
      item.rental.days = extendRequest.newRentalDays;
    });

    order.total = (order.total || 0) + extendRequest.additionalTotal;
    order.subtotal = (order.subtotal || 0) + extendRequest.additionalTotal;

    if (!order.statusHistory) order.statusHistory = [];
    const statusText = extendRequest.daysChanged > 0 ? "đã gia hạn" : "đã rút ngắn";
    order.statusHistory.push({
      status: statusText,
      timestamp: new Date(),
      changedBy: extendRequest.userId,
      notes: `Gia hạn thêm ${Math.abs(extendRequest.daysChanged)} ngày. Thanh toán: ${extendRequest.additionalTotal.toLocaleString()}đ`
    });

    await order.save();

    // Xóa request đã xử lý
    extendRequests.delete(requestId);

    res.json({ 
      success: true, 
      message: `Đã ${statusText} thành công!`,
      order 
    });

  } catch (error) {
    console.error("Lỗi xác nhận gia hạn:", error);
    res.status(500).json({ success: false, message: "Lỗi server: " + String(error) });
  }
});

export default orderRouter;
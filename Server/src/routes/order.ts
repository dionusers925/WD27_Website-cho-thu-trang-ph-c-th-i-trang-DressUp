import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order";

const orderRouter = express.Router();

const calcRentalDays = (start: Date, end: Date) => {
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

// ========== TỪ NHÁNH CBE (utility functions) ==========
const normalizeValue = (value: any) =>
  String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const getProductIdentifier = (productId: any) =>
  String(productId?._id ?? productId ?? "").trim();

const buildVariantKey = (productId: any, size: any, color: any) =>
  `${getProductIdentifier(productId)}::${normalizeValue(size)}::${normalizeValue(color)}`;

// Danh sách trạng thái cho phép
const allowedStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "renting",
  "returning",
  "picked_up",
  "returned",
  "fee_incurred",
  "completed",
  "laundry",
  "in_warehouse",
  "cancelled",
];

const allowedPaymentStatuses = ["pending", "paid", "completed", "success"];

// ========== API LẤY DANH SÁCH ĐƠN HÀNG ==========
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

// ========== API LẤY LỊCH SỬ ĐƠN HÀNG CỦA USER ==========
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

// ========== API TRẢ ĐỒ ==========
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

// ========== API LẤY CHI TIẾT ĐƠN HÀNG ==========
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

// ========== TẠO ĐƠN HÀNG MỚI ==========
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

// ========== CẬP NHẬT ĐƠN HÀNG ==========
orderRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      lateFee, damageFee, status, paymentStatus, overdueDays, 
      damageErrors, lostItems, updatedBy, returnMedia, 
      adminReturnMedia, penaltyNote, deliveryProof, depositReturnProof
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const updates: any = {};

    if (lateFee !== undefined) updates.lateFee = lateFee;
    if (damageFee !== undefined) updates.damageFee = damageFee;
    if (status !== undefined) updates.status = status;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
    if (overdueDays !== undefined) updates.overdueDays = overdueDays;
    if (damageErrors !== undefined) updates.damageErrors = damageErrors;
    if (lostItems !== undefined) updates.lostItems = lostItems;
    if (returnMedia !== undefined) updates.returnMedia = returnMedia;
    if (adminReturnMedia !== undefined) updates.adminReturnMedia = adminReturnMedia;
    if (penaltyNote !== undefined) updates.penaltyNote = penaltyNote;
    if (deliveryProof !== undefined) updates.deliveryProof = deliveryProof;
    if (depositReturnProof !== undefined) updates.depositReturnProof = depositReturnProof;

    // Tính toán phí trễ hạn
    let resolvedLateDays = updates.overdueDays ?? 0;
    let resolvedLateFee = updates.lateFee ?? 0;
    
    if (resolvedLateDays > 0 && resolvedLateFee === 0) {
      const rentalSubtotal = (currentOrder.items ?? []).reduce((sum: number, item: any) => {
        const price = Number(item.price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        return sum + price * quantity;
      }, 0);
      const rentPerDay = rentalSubtotal;
      resolvedLateFee = Math.round(rentPerDay * resolvedLateDays);
      updates.lateFee = resolvedLateFee;
    }

    // Tính tổng phí
    const activeLostItems = Array.isArray(updates.lostItems) ? updates.lostItems : (currentOrder.lostItems ?? []);
    const lostDepositTotal = (currentOrder.items ?? []).reduce((sum: number, item: any) => {
      const key = String(item?._id ?? "");
      if (key && activeLostItems.includes(key)) {
        return sum + Number(item.deposit ?? 0) * Number(item.quantity ?? 1);
      }
      return sum;
    }, 0);

    const feeTotal = (resolvedLateFee + (updates.damageFee ?? 0) + lostDepositTotal);
    
    // Tính tổng tiền mới
    const rentalSubtotal = (currentOrder.items ?? []).reduce((sum: number, item: any) => {
      const price = Number(item.price ?? 0);
      const quantity = Number(item.quantity ?? 1);
      return sum + price * quantity;
    }, 0);
    const depositTotal = (currentOrder.items ?? []).reduce((sum: number, item: any) => {
      const deposit = Number(item.deposit ?? 0);
      const quantity = Number(item.quantity ?? 1);
      return sum + deposit * quantity;
    }, 0);

    const targetStatus = updates.status ?? currentOrder.status;
    const nextTotal = targetStatus === "completed" 
      ? rentalSubtotal + feeTotal 
      : rentalSubtotal + depositTotal + feeTotal;
    updates.total = nextTotal;

    // Cập nhật các field thường
    await Order.findByIdAndUpdate(id, { $set: updates });

    // Thêm lịch sử nếu có thay đổi
    const updatedByUser = typeof updatedBy === 'string' && updatedBy.trim() ? updatedBy.trim() : 'Hệ thống';
    const historyPushOps: any = {};

    if (updates.status && updates.status !== currentOrder.status) {
      historyPushOps.statusHistory = {
        status: updates.status,
        updatedBy: updatedByUser,
        date: new Date(),
      };
    }

    if (updates.paymentStatus && updates.paymentStatus !== currentOrder.paymentStatus) {
      historyPushOps.paymentStatusHistory = {
        status: updates.paymentStatus,
        updatedBy: updatedByUser,
        date: new Date(),
      };
    }

    let updatedOrder;
    if (Object.keys(historyPushOps).length > 0) {
      updatedOrder = await Order.findByIdAndUpdate(
        id,
        { $push: historyPushOps },
        { new: true }
      );
    } else {
      updatedOrder = await Order.findById(id);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi Server khi cập nhật" });
  }
});

export default orderRouter;
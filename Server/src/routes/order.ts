import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order";

const orderRouter = express.Router();

const calcRentalDays = (start: Date, end: Date) => {
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

// Lấy danh sách đơn hàng
orderRouter.get("/", async (_req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("items.productId", "name price images")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
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
      .populate("userId", "name email")
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
      note,
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
      status: "pending",
      startDate: start,
      endDate: end,
      items: normalizedItems,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerAddress: customerAddress || undefined,
      note: note || undefined,
      shippingAddress: {
        name: customerName || "Khách tại quầy",
        phone: customerPhone || undefined,
        address: customerAddress || "Tại quầy",
        city: "Tại quầy",
      },
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Lỗi Backend:", error);
    res.status(400).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
});

export default orderRouter;

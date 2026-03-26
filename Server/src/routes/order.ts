import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import Variant from "../models/variant.model";
import VariantStockHistory from "../models/variantStockHistory.model";

const orderRouter = express.Router();

const calcRentalDays = (start: Date, end: Date) => {
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

const allowedStatuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
];

const allowedPaymentStatuses = ["pending", "paid", "completed", "success"];

const normalizeValue = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const buildVariantKey = (productId: any, size: any, color: any) =>
  `${String(productId)}::${normalizeValue(size)}::${normalizeValue(color)}`;

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
      paymentStatus,
      status,
      lateFee,
      lateDays,
      damageFee,
      penaltyNote,
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
            size: item?.size ? String(item.size) : "",
            color: item?.color ? String(item.color) : "",
            deposit: Number(item?.deposit ?? 0) || 0,
            quantity: Number(item?.quantity ?? 1) || 1,
            price: Number(item?.price ?? 0) || 0,
          }))
          .filter((item: any) => item.productId)
      : [];

    if (normalizedItems.length === 0) {
      return res.status(400).json({ message: "Đơn hàng phải có ít nhất 1 sản phẩm." });
    }

    const missingVariantInfo = normalizedItems.find(
      (item: any) => !item.size || !item.color
    );
    if (missingVariantInfo) {
      return res.status(400).json({
        message: "Sản phẩm thuê phải có Size và Màu.",
      });
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

    let normalizedLateDays = Number(lateDays ?? 0) || 0;
    const rentalPerDay = normalizedItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    let extraLateFee =
      normalizedLateDays > 0
        ? rentalPerDay * normalizedLateDays
        : Number(lateFee ?? 0) || 0;
    let extraDamageFee = Number(damageFee ?? 0) || 0;

    if (resolvedStatus !== "completed") {
      normalizedLateDays = 0;
      extraLateFee = 0;
      extraDamageFee = 0;
    }

    const computedTotalWithFees = computedTotal + extraLateFee + extraDamageFee;

    const orderTotal = Number(total);
    const finalTotal =
      Number.isFinite(orderTotal) && orderTotal > 0
        ? orderTotal
        : computedTotalWithFees;

    const resolvedStatus =
      typeof status === "string" && allowedStatuses.includes(status)
        ? status
        : "pending";
    const resolvedPaymentStatus =
      typeof paymentStatus === "string" &&
      allowedPaymentStatuses.includes(paymentStatus)
        ? paymentStatus
        : "pending";

    const orderNumber = `DU${new Date().getFullYear()}${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const aggregated = new Map<
      string,
      { productId: string; size: string; color: string; quantity: number }
    >();
    normalizedItems.forEach((item: any) => {
      const key = buildVariantKey(item.productId, item.size, item.color);
      const current = aggregated.get(key);
      if (current) {
        current.quantity += Number(item.quantity ?? 1) || 1;
      } else {
        aggregated.set(key, {
          productId: String(item.productId),
          size: String(item.size ?? "").trim(),
          color: String(item.color ?? "").trim(),
          quantity: Number(item.quantity ?? 1) || 1,
        });
      }
    });

    const productIds = Array.from(
      new Set(Array.from(aggregated.values()).map((item) => item.productId))
    );
    const variants = await Variant.find({
      productId: { $in: productIds },
    }).lean();

    const variantMap = new Map<string, any>();
    variants.forEach((variant) => {
      const key = buildVariantKey(
        variant.productId,
        variant.size,
        variant.color
      );
      if (!variantMap.has(key)) {
        variantMap.set(key, variant);
      }
    });

    const pendingUpdates: {
      variant: any;
      quantity: number;
    }[] = [];

    for (const item of aggregated.values()) {
      const key = buildVariantKey(item.productId, item.size, item.color);
      const variant = variantMap.get(key);
      if (!variant) {
        return res.status(400).json({
          message: `Không tìm thấy biến thể cho Size "${item.size}" và Màu "${item.color}".`,
        });
      }
      const available = Number(variant.stock ?? 0);
      if (available < item.quantity) {
        return res.status(400).json({
          message: `Tồn kho không đủ cho "${variant.sku || variant.size + " - " + variant.color}".`,
        });
      }
      pendingUpdates.push({ variant, quantity: item.quantity });
    }

    const appliedUpdates: { variantId: string; quantity: number }[] = [];
    const historyDocs: any[] = [];

    const rollbackStock = async () => {
      for (const applied of appliedUpdates) {
        await Variant.updateOne(
          { _id: applied.variantId },
          { $inc: { stock: applied.quantity, reservedStock: -applied.quantity } }
        );
      }
    };

    for (const item of pendingUpdates) {
      const oldStock = Number(item.variant.stock ?? 0);
      const updated = await Variant.findOneAndUpdate(
        { _id: item.variant._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, reservedStock: item.quantity } },
        { new: true }
      );

      if (!updated) {
        await rollbackStock();
        return res.status(400).json({
          message: "Tồn kho không đủ, vui lòng kiểm tra lại.",
        });
      }

      appliedUpdates.push({
        variantId: String(item.variant._id),
        quantity: item.quantity,
      });

      historyDocs.push({
        productId: item.variant.productId,
        variantId: item.variant._id,
        sku: String(item.variant.sku ?? "").trim(),
        size: String(item.variant.size ?? "").trim(),
        color: String(item.variant.color ?? "").trim(),
        oldStock,
        newStock: Number(updated.stock ?? 0),
        change: -item.quantity,
        action: "rent",
        note: `Order: ${orderNumber}`,
      });
    }

    const newOrder = new Order({
      userId: resolvedUserId,
      total: finalTotal,
      subtotal: rentalSubtotal,
      paymentMethod: paymentMethod || "cash",
      paymentStatus: resolvedPaymentStatus,
      orderNumber,
      status: resolvedStatus,
      startDate: start,
      endDate: end,
      items: normalizedItems,
      lateDays: normalizedLateDays,
      lateFee: extraLateFee,
      damageFee: extraDamageFee,
      penaltyNote: resolvedStatus === "completed" ? penaltyNote || undefined : undefined,
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

    try {
      await newOrder.save();
    } catch (error) {
      await rollbackStock();
      return res.status(400).json({ message: "Lỗi tạo đơn hàng" });
    }

    try {
      if (historyDocs.length > 0) {
        await VariantStockHistory.insertMany(historyDocs);
      }
    } catch (error) {
      await rollbackStock();
      await Order.findByIdAndDelete(newOrder._id);
      await VariantStockHistory.deleteMany({ note: `Order: ${orderNumber}` });
      return res.status(400).json({ message: "Không thể lưu lịch sử tồn kho." });
    }

    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Lỗi Backend:", error);
    res.status(400).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
});

// Cập nhật trạng thái và phí phạt
orderRouter.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const updates: any = {};
    if (typeof req.body.status === "string") {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }
      updates.status = req.body.status;
    }

    if (typeof req.body.paymentStatus === "string") {
      if (!allowedPaymentStatuses.includes(req.body.paymentStatus)) {
        return res.status(400).json({ message: "Trạng thái thanh toán không hợp lệ" });
      }
      updates.paymentStatus = req.body.paymentStatus;
    }

    if (req.body.lateDays !== undefined) {
      updates.lateDays = Number(req.body.lateDays ?? 0) || 0;
    }
    if (req.body.damageFee !== undefined) {
      updates.damageFee = Number(req.body.damageFee ?? 0) || 0;
    }
    if (req.body.penaltyNote !== undefined) {
      updates.penaltyNote = String(req.body.penaltyNote ?? "");
    }

    const start = order.startDate ?? new Date();
    const end = order.endDate ?? start;
    const rentalDays = calcRentalDays(start, end);

    const rentalSubtotal =
      Number(order.subtotal ?? 0) ||
      (order.items ?? []).reduce((sum: number, item: any) => {
        const price = Number(item.price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        return sum + price * quantity * rentalDays;
      }, 0);

    const depositTotal = (order.items ?? []).reduce((sum: number, item: any) => {
      const deposit = Number(item.deposit ?? 0);
      const quantity = Number(item.quantity ?? 1);
      return sum + deposit * quantity;
    }, 0);

    const rentalPerDay = (order.items ?? []).reduce((sum: number, item: any) => {
      const price = Number(item.price ?? 0);
      const quantity = Number(item.quantity ?? 1);
      return sum + price * quantity;
    }, 0);

    const targetStatus = updates.status ?? order.status;

    if (targetStatus !== "completed") {
      updates.lateDays = 0;
      updates.lateFee = 0;
      updates.damageFee = 0;
      updates.penaltyNote = "";
    }

    const resolvedLateDays =
      targetStatus === "completed"
        ? updates.lateDays !== undefined
          ? updates.lateDays
          : Number(order.lateDays ?? 0) || 0
        : 0;

    const lateFeeValue =
      targetStatus === "completed" ? rentalPerDay * resolvedLateDays : 0;

    updates.lateFee = lateFeeValue;
    updates.lateDays = resolvedLateDays;

    const damageFeeValue =
      targetStatus === "completed"
        ? updates.damageFee !== undefined
          ? updates.damageFee
          : Number(order.damageFee ?? 0) || 0
        : 0;

    updates.total = rentalSubtotal + depositTotal + lateFeeValue + damageFeeValue;

    const updated = await Order.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
});

export default orderRouter;

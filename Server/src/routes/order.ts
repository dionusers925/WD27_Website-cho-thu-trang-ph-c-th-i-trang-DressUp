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
  "fee_incurred",
  "completed",
  "cancelled",
];

const allowedPaymentStatuses = ["pending", "paid", "completed", "success"];

const normalizeValue = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const buildVariantKey = (productId: any, size: any, color: any) =>
  `${String(productId)}::${normalizeValue(size)}::${normalizeValue(color)}`;

// L?y danh s?ch ??n h?ng
orderRouter.get("/", async (_req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("items.productId", "name price images")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "L?i Server" });
  }
});

// L?y chi ti?t ??n h?ng
orderRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID ??n h?ng kh?ng h?p l?" });
    }

    const order = await Order.findById(id)
      .populate("userId", "name email")
      .populate("items.productId", "name price images");

    if (!order) {
      return res.status(404).json({ message: "Kh?ng t?m th?y ??n h?ng" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "L?i Server" });
  }
});

// T?o ??n h?ng m?i
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
      overdueDays,
      damageErrors,
      lostItems,
      items,
      startDate,
      endDate,
      customerName,
      customerPhone,
      customerAddress,
      bankName,
      bankAccount,
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
            variantId:
              item?.variantId &&
              mongoose.Types.ObjectId.isValid(String(item.variantId))
                ? item.variantId
                : undefined,
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
      return res
        .status(400)
        .json({ message: "??n h?ng ph?i c? ?t nh?t 1 s?n ph?m." });
    }

    const missingVariantInfo = normalizedItems.find(
      (item: any) => !item.variantId && (!item.size || !item.color)
    );
    if (missingVariantInfo) {
      return res.status(400).json({
        message: "S?n ph?m thu? ph?i c? Size v? M?u.",
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

    const resolvedStatus =
      typeof status === "string" && allowedStatuses.includes(status)
        ? status
        : "pending";
    const resolvedPaymentStatus =
      typeof paymentStatus === "string" &&
      allowedPaymentStatuses.includes(paymentStatus)
        ? paymentStatus
        : "pending";

    let normalizedLateDays =
      Number(lateDays ?? overdueDays ?? 0) || 0;
    const rentalPerDay = normalizedItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    let extraLateFee =
      Number(lateFee ?? 0) ||
      (normalizedLateDays > 0 ? rentalPerDay * normalizedLateDays : 0);
    let extraDamageFee = Number(damageFee ?? 0) || 0;

    const penaltyEnabled =
      resolvedStatus === "completed" || resolvedStatus === "fee_incurred";
    if (!penaltyEnabled) {
      normalizedLateDays = 0;
      extraLateFee = 0;
      extraDamageFee = 0;
    }

    const computedTotal = rentalSubtotal + depositTotal;
    const computedTotalWithFees = computedTotal + extraLateFee + extraDamageFee;

    const orderTotal = Number(total);
    const finalTotal =
      Number.isFinite(orderTotal) && orderTotal > 0
        ? orderTotal
        : computedTotalWithFees;

    const orderNumber = `DU${new Date().getFullYear()}${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const aggregated = new Map<
      string,
      {
        productId: string;
        variantId?: string;
        size: string;
        color: string;
        quantity: number;
      }
    >();
    normalizedItems.forEach((item: any) => {
      const key = item.variantId
        ? `variant:${String(item.variantId)}`
        : buildVariantKey(item.productId, item.size, item.color);
      const current = aggregated.get(key);
      if (current) {
        current.quantity += Number(item.quantity ?? 1) || 1;
      } else {
        aggregated.set(key, {
          productId: String(item.productId),
          variantId: item.variantId ? String(item.variantId) : undefined,
          size: String(item.size ?? "").trim(),
          color: String(item.color ?? "").trim(),
          quantity: Number(item.quantity ?? 1) || 1,
        });
      }
    });

    const variantIdList = Array.from(
      new Set(
        Array.from(aggregated.values())
          .map((item) => item.variantId)
          .filter(Boolean)
      )
    );

    const productIds = Array.from(
      new Set(
        Array.from(aggregated.values())
          .filter((item) => !item.variantId)
          .map((item) => item.productId)
      )
    );

    const variantQuery: any[] = [];
    if (variantIdList.length > 0) {
      variantQuery.push({ _id: { $in: variantIdList } });
    }
    if (productIds.length > 0) {
      variantQuery.push({ productId: { $in: productIds } });
    }
    const variants = await Variant.find(
      variantQuery.length > 0 ? { $or: variantQuery } : {}
    ).lean();

    const variantMapById = new Map<string, any>();
    const variantMapByKey = new Map<string, any>();
    variants.forEach((variant) => {
      variantMapById.set(String(variant._id), variant);
      const key = buildVariantKey(
        variant.productId,
        variant.size,
        variant.color
      );
      if (!variantMapByKey.has(key)) {
        variantMapByKey.set(key, variant);
      }
    });

    const pendingUpdates: {
      variant: any;
      quantity: number;
    }[] = [];

    for (const item of aggregated.values()) {
      const variant = item.variantId
        ? variantMapById.get(item.variantId)
        : variantMapByKey.get(
            buildVariantKey(item.productId, item.size, item.color)
          );
      if (!variant) {
        return res.status(400).json({
          message: item.variantId
            ? "Kh?ng t?m th?y bi?n th? ???c ch?n."
            : `Kh?ng t?m th?y bi?n th? cho Size "${item.size}" v? M?u "${item.color}".`,
        });
      }
      const available = Number(variant.stock ?? 0);
      if (available < item.quantity) {
        return res.status(400).json({
          message: `T?n kho kh?ng ?? cho "${variant.sku || variant.size + " - " + variant.color}".`,
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
          message: "T?n kho kh?ng ??, vui l?ng ki?m tra l?i.",
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
      penaltyNote: penaltyEnabled ? penaltyNote || undefined : undefined,
      overdueDays: Number(overdueDays ?? normalizedLateDays) || 0,
      damageErrors: Array.isArray(damageErrors) ? damageErrors : [],
      lostItems: Array.isArray(lostItems) ? lostItems : [],
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerAddress: customerAddress || undefined,
      bankName: bankName || undefined,
      bankAccount: bankAccount || undefined,
      note: note || undefined,
      shippingAddress: {
        name: customerName || "Kh?ch t?i qu?y",
        phone: customerPhone || undefined,
        address: customerAddress || "T?i qu?y",
        city: "T?i qu?y",
      },
    });

    try {
      await newOrder.save();
    } catch (error) {
      await rollbackStock();
      return res.status(400).json({ message: "L?i t?o ??n h?ng" });
    }

    try {
      if (historyDocs.length > 0) {
        await VariantStockHistory.insertMany(historyDocs);
      }
    } catch (error) {
      await rollbackStock();
      await Order.findByIdAndDelete(newOrder._id);
      await VariantStockHistory.deleteMany({ note: `Order: ${orderNumber}` });
      return res
        .status(400)
        .json({ message: "Kh?ng th? l?u l?ch s? t?n kho." });
    }

    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("L?i Backend:", error);
    res.status(400).json({ message: "L?i t?o ??n h?ng", error: error.message });
  }
});

const handleUpdateOrder = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID ??n h?ng kh?ng h?p l?" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Kh?ng t?m th?y ??n h?ng" });
    }

    const updates: any = {};

    if (typeof req.body.status === "string") {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: "Tr?ng th?i kh?ng h?p l?" });
      }
      updates.status = req.body.status;
    }

    if (typeof req.body.paymentStatus === "string") {
      if (!allowedPaymentStatuses.includes(req.body.paymentStatus)) {
        return res
          .status(400)
          .json({ message: "Tr?ng th?i thanh to?n kh?ng h?p l?" });
      }
      updates.paymentStatus = req.body.paymentStatus;
    }

    if (req.body.lateDays !== undefined) {
      updates.lateDays = Number(req.body.lateDays ?? 0) || 0;
      updates.overdueDays = updates.lateDays;
    }

    if (req.body.overdueDays !== undefined) {
      updates.overdueDays = Number(req.body.overdueDays ?? 0) || 0;
      if (updates.lateDays === undefined) {
        updates.lateDays = updates.overdueDays;
      }
    }

    if (req.body.lateFee !== undefined) {
      updates.lateFee = Number(req.body.lateFee ?? 0) || 0;
    }

    if (req.body.damageFee !== undefined) {
      updates.damageFee = Number(req.body.damageFee ?? 0) || 0;
    }

    if (req.body.penaltyNote !== undefined) {
      updates.penaltyNote = String(req.body.penaltyNote ?? "");
    }

    if (req.body.damageErrors !== undefined) {
      updates.damageErrors = Array.isArray(req.body.damageErrors)
        ? req.body.damageErrors
        : [];
    }

    if (req.body.lostItems !== undefined) {
      updates.lostItems = Array.isArray(req.body.lostItems)
        ? req.body.lostItems
        : [];
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
    const penaltyEnabled =
      targetStatus === "completed" || targetStatus === "fee_incurred";

    if (!penaltyEnabled) {
      updates.lateDays = 0;
      updates.lateFee = 0;
      updates.damageFee = 0;
      updates.penaltyNote = "";
      updates.overdueDays = 0;
      updates.damageErrors = [];
      updates.lostItems = [];
    }

    const resolvedLateDays = penaltyEnabled
      ? updates.lateDays !== undefined
        ? updates.lateDays
        : Number(order.lateDays ?? 0) || 0
      : 0;

    let resolvedLateFee = 0;
    if (penaltyEnabled) {
      resolvedLateFee =
        updates.lateFee !== undefined
          ? updates.lateFee
          : rentalPerDay * resolvedLateDays;
    }

    const resolvedDamageFee = penaltyEnabled
      ? updates.damageFee !== undefined
        ? updates.damageFee
        : Number(order.damageFee ?? 0) || 0
      : 0;

    const activeLostItems = Array.isArray(updates.lostItems)
      ? updates.lostItems
      : Array.isArray(order.lostItems)
      ? order.lostItems
      : [];

    const lostDepositTotal = (order.items ?? []).reduce(
      (sum: number, item: any) => {
        const key = String(item?._id ?? "");
        if (key && activeLostItems.includes(key)) {
          return sum + Number(item.deposit ?? 0) * Number(item.quantity ?? 1);
        }
        return sum;
      },
      0
    );

    updates.lateDays = resolvedLateDays;
    updates.overdueDays = updates.overdueDays ?? resolvedLateDays;
    updates.lateFee = resolvedLateFee;
    updates.damageFee = resolvedDamageFee;

    const feeTotal = resolvedLateFee + resolvedDamageFee + lostDepositTotal;
    const nextTotal =
      targetStatus === "completed"
        ? rentalSubtotal + feeTotal
        : rentalSubtotal + depositTotal + feeTotal;

    updates.total = nextTotal;

    const updated = await Order.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "L?i Server" });
  }
};

// C?p nh?t tr?ng th?i & ph?
orderRouter.patch("/:id", handleUpdateOrder);
orderRouter.put("/:id", handleUpdateOrder);

export default orderRouter;

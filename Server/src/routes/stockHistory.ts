import express from "express";
import mongoose from "mongoose";
import VariantStockHistory from "../models/variantStockHistory.model";
import Variant from "../models/variant.model";

const router = express.Router();

router.get("/stock-history", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const limit = Math.max(1, Number(req.query.limit ?? 10) || 10);
    const sku = String(req.query.sku ?? "").trim();
    const action = String(req.query.action ?? "").trim();
    const productId = String(req.query.productId ?? "").trim();
    const from = String(req.query.from ?? "").trim();
    const to = String(req.query.to ?? "").trim();

    const query: any = {};
    if (sku) {
      query.sku = { $regex: sku, $options: "i" };
    }
    if (action) {
      query.action = action;
    }
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.productId = productId;
    }
    if (from || to) {
      query.createdAt = {};
      if (from) {
        query.createdAt.$gte = new Date(from);
      }
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const total = await VariantStockHistory.countDocuments(query);
    const items = await VariantStockHistory.find(query)
      .populate("productId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/stock-adjust", async (req, res) => {
  try {
    const { variantId, change, note } = req.body;
    if (!variantId || !mongoose.Types.ObjectId.isValid(String(variantId))) {
      return res.status(400).json({ message: "Biến thể không hợp lệ" });
    }

    const delta = Number(change);
    if (!Number.isFinite(delta) || delta === 0) {
      return res
        .status(400)
        .json({ message: "Số lượng điều chỉnh không hợp lệ" });
    }

    const variant = await Variant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ message: "Không tìm thấy biến thể" });
    }

    const oldStock = Number(variant.stock ?? 0);
    const newStock = oldStock + delta;
    if (newStock < 0) {
      return res
        .status(400)
        .json({ message: "Tồn kho không đủ để trừ" });
    }

    variant.stock = newStock;
    await variant.save();

    const history = await VariantStockHistory.create({
      productId: variant.productId,
      variantId: variant._id,
      sku: String(variant.sku ?? "").trim(),
      size: String(variant.size ?? "").trim(),
      color: String(variant.color ?? "").trim(),
      oldStock,
      newStock,
      change: delta,
      action: "adjust",
      note: note ? String(note) : undefined,
    });

    res.json({
      success: true,
      data: {
        variant,
        history,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/stock-return", async (req, res) => {
  try {
    const { historyId, decision, reason } = req.body;
    if (!historyId || !mongoose.Types.ObjectId.isValid(String(historyId))) {
      return res.status(400).json({ message: "Lịch sử không hợp lệ" });
    }

    const normalizedDecision = decision === "discard" ? "discard" : "restock";

    const history = await VariantStockHistory.findById(historyId);
    if (!history) {
      return res.status(404).json({ message: "Không tìm thấy lịch sử" });
    }

    if (history.action !== "returned") {
      return res.status(400).json({ message: "Lịch sử không hợp lệ" });
    }

    if (history.processed) {
      return res.status(400).json({ message: "Lịch sử đã được xử lý" });
    }

    const qty = Number(history.quantity ?? 0);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: "Số lượng không hợp lệ" });
    }

    const variant = await Variant.findById(history.variantId);
    if (!variant) {
      return res.status(404).json({ message: "Không tìm thấy biến thể" });
    }

    const currentStock = Number(variant.stock ?? 0);
    const currentReserved = Number(variant.reservedStock ?? 0);

    if (normalizedDecision === "restock") {
      const newStock = currentStock + qty;
      variant.stock = newStock;
      variant.reservedStock = Math.max(0, currentReserved - qty);
      await variant.save();

      history.oldStock = currentStock;
      history.newStock = newStock;
      history.change = qty;
    } else {
      variant.reservedStock = Math.max(0, currentReserved - qty);
      await variant.save();

      history.oldStock = currentStock;
      history.newStock = currentStock;
      history.change = 0;
    }

    history.processed = true;
    history.decision = normalizedDecision;
    if (reason) {
      history.reason = String(reason).trim();
    }

    await history.save();

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;

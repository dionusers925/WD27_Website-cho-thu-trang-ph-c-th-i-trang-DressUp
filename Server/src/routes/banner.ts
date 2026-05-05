import express from "express";
import Banner from "../models/Banner";

const router = express.Router();

// GET all banners (sorted by sortOrder)
router.get("/", async (req, res) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json(banners);
  } catch {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET single banner
router.get("/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Không tìm thấy banner" });
    res.json(banner);
  } catch {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST create banner
router.post("/", async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch {
    res.status(500).json({ message: "Tạo banner thất bại" });
  }
});

// PUT update banner
router.put("/:id", async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!banner) return res.status(404).json({ message: "Không tìm thấy banner" });
    res.json(banner);
  } catch {
    res.status(500).json({ message: "Cập nhật thất bại" });
  }
});

// DELETE banner
router.delete("/:id", async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: "Xóa thành công" });
  } catch {
    res.status(500).json({ message: "Xóa thất bại" });
  }
});

export default router;

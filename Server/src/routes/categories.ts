import express from "express";
import Category from "../models/Category";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id);
  res.json(category);
});

router.post("/", async (req, res) => {
  const category = await Category.create(req.body);
  res.json(category);
});

router.put("/:id", async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
  });

  res.json(category);
});

router.delete("/:id", async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Xóa thành công" });
});

export default router;

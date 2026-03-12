import express from "express";
import Product from "../models/Product";

const product = express.Router();

// Lấy danh sách sản phẩm
product.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy sản phẩm" });
  }
});

// Lấy chi tiết sản phẩm theo id
product.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết sản phẩm" });
  }
});

export default product;

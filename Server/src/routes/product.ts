import express from "express";
import Product from "../models/Product"; // Đường dẫn tới model Product của bạn

const productRouter = express.Router();

productRouter.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products); // Trả về mảng sản phẩm
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy sản phẩm" });
  }
});

export default productRouter;
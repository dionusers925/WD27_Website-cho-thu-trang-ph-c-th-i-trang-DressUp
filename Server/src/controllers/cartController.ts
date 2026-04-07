import { Request, Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart";
import Product from "../models/Product";

export const addToCart = async (req: Request, res: Response) => {
  try {
    const { userId, productId, quantity = 1, days = 1, size, color } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // lấy giá theo số ngày thuê
    const tier = product.rentalTiers?.find((t) => t.days === days);
    const price = tier?.price || (product.rentalTiers?.[0]?.price || 0) * (days || 1);

    // Chuyển userId thành ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    let cart = await Cart.findOne({ user: userObjectId });

    if (!cart) {
      cart = await Cart.create({
        user: userObjectId,
        items: [],
      });
    }

    // Tìm item đã tồn tại
    const existingItem = cart.items.find(
      (i) => i.product.toString() === productId && i.days === days,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price,
        days,
        size,
        color,
      });
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ user: userObjectId }).populate("items.product");

    res.json(updatedCart);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Add to cart failed" });
  }
};

// Hàm xóa giỏ hàng
export const clearCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const result = await Cart.updateOne(
      { user: userObjectId },
      { $set: { items: [] } }
    );

    if (result.modifiedCount > 0) {
      res.json({ success: true, message: "Đã xóa giỏ hàng" });
    } else {
      res.json({ success: false, message: "Không tìm thấy giỏ hàng" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi xóa giỏ hàng" });
  }
};
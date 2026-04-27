import { Request, Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart";
import Product from "../models/Product";

// Thêm vào giỏ hàng
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { userId, productId, quantity = 1, days = 1, size, color, startDate, endDate } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Thiếu ngày bắt đầu hoặc ngày kết thúc" });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const rentalPrices = (product as any).rentalPrices ?? (product as any).rentalTiers ?? [];
    const tier = rentalPrices.find((t: any) => t.days === days);
    const basePrice = rentalPrices?.[0]?.price ?? 0;
    const price = tier?.price || basePrice * (days || 1);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    let cart = await Cart.findOne({ user: userObjectId });

    if (!cart) {
      cart = await Cart.create({
        user: userObjectId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (i) => i.product.toString() === productId && i.days === days && i.startDate?.toString() === startDate
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
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    console.log("📦 Back-end lưu:", { startDate, endDate, days });

    await cart.save();

    const updatedCart = await Cart.findOne({ user: userObjectId }).populate("items.product");

    res.json(updatedCart);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Add to cart failed" });
  }
};

// Lấy giỏ hàng
export const getCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId as string);
    
    const cart = await Cart.findOne({ user: userObjectId }).populate("items.product");

    if (!cart) {
      return res.json({ items: [] });
    }

    const formattedItems = cart.items.map(item => ({
      _id: item._id,
      productId: (item.product as any)._id,
      name: (item.product as any).name,
      image: (item.product as any).images?.[0],
      quantity: item.quantity,
      days: item.days,
      price: item.price,
      rentalPrice: item.price,
      deposit: (item.product as any).depositDefault || 0,
      size: item.size,
      color: item.color,
      startDate: item.startDate,
      endDate: item.endDate,
    }));

    console.log("📦 Trả về giỏ hàng:", formattedItems.map(i => ({
      name: i.name,
      startDate: i.startDate,
      endDate: i.endDate
    })));

    res.json({ items: formattedItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi lấy giỏ hàng" });
  }
};

// Cập nhật số lượng
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params as { itemId: string };

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const { quantity } = req.body;

    const cart = await Cart.findOne({ "items._id": itemId });

    if (!cart) {
      return res.status(404).json({ message: "Không tìm thấy item" });
    }

    const item = cart.items.id(itemId);
    if (item) {
      item.quantity = quantity;
      await cart.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi cập nhật" });
  }
};

// Xóa một item
export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params as { itemId: string }; // 👈 Ép kiểu

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const cart = await Cart.findOne({ "items._id": itemId });

    if (!cart) {
      return res.status(404).json({ message: "Không tìm thấy item" });
    }

    cart.items.pull({ _id: new mongoose.Types.ObjectId(itemId) }); // 👈 Ép kiểu ObjectId
    await cart.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi xóa item" });
  }
};

// Xóa toàn bộ giỏ hàng
export const clearCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId as string);
    
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
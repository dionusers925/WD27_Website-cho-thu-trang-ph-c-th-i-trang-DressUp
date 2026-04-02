import { Request, Response } from "express";
import Cart from "../models/Cart";
import Product from "../models/Product";

const demoUser = "65c000000000000000000001";

export const addToCart = async (req: Request, res: Response) => {
  try {
    const { productId, quantity = 1, days = 1, size, color } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // lấy giá theo số ngày thuê
    const rentalPrices =
      (product as any).rentalPrices ?? (product as any).rentalTiers ?? [];
    const tier = rentalPrices.find((t: any) => t.days === days);
    const basePrice = rentalPrices?.[0]?.price ?? 0;
    const price = tier?.price || basePrice * (days || 1);


    let cart = await Cart.findOne({ user: demoUser });

    if (!cart) {
      cart = await Cart.create({
        user: demoUser,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (i) =>
        i.product.toString() === productId &&
        i.size === size &&
        i.color === color &&
        i.days === days,
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

    const updatedCart = await Cart.findOne({ user: demoUser }).populate(
      "items.product",
    );

    res.json(updatedCart);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Add to cart failed" });
  }
};

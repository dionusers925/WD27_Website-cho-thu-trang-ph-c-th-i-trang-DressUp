import { Router } from "express";
import Product from "../models/Product";

const router = Router();

let cart: any = {
  items: [],
};

router.get("/cart", (req, res) => {
  res.json(cart);
});

router.post("/cart", async (req, res) => {
  try {
    const { productId, quantity, days } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const rentalPrices =
      (product as any).rentalPrices ?? (product as any).rentalTiers ?? [];
    const tier = rentalPrices.find((t: any) => t.days === days);

    const rentalPrice = tier
      ? tier.price
      : (rentalPrices?.[0]?.price || 0) * days;

    const existingItem = cart.items.find((i: any) => i._id === productId);

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      const item = {
        _id: product._id.toString(),
        name: product.name,
        price: rentalPrice,
        days: days,
        quantity: quantity || 1,
        image: product.images?.[0] || "",
      };

      cart.items.push(item);
    }

    res.json(cart);
  } catch (error) {
    console.log("Cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/cart/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const item = cart.items.find((i: any) => i._id === id);

  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  item.quantity = quantity;

  res.json(cart);
});

router.delete("/cart/:id", (req, res) => {
  const { id } = req.params;

  cart.items = cart.items.filter((i: any) => i._id !== id);

  res.json(cart);
});

router.delete("/cart", (req, res) => {
  cart.items = [];
  res.json(cart);
});

export default router;

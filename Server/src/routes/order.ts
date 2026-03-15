import express from "express";
import { Order } from "../models/Order"; 

const orderRouter = express.Router();


orderRouter.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email") 
      .populate("items.productId", "name price") 
      .sort({ createdAt: -1 }); 
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
});


orderRouter.post("/", async (req, res) => {
  try {
    
    const { userId, total, paymentMethod, items, startDate, endDate } = req.body;

    const newOrder = new Order({
      userId,
      total,
      paymentMethod: paymentMethod || "cash",
     
      orderNumber: `DU${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      status: "pending", 
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      items: items || [],
      shippingAddress: { address: "Tại quầy", city: "Tại quầy" } 
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Lỗi Backend:", error);
    res.status(400).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
});

orderRouter.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email phone") 
      .populate("items.productId", "name price depositDefault"); 
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng này trong Database" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server khi lấy chi tiết đơn hàng" });
  }
});

orderRouter.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const updateFields: any = { status };

    
    if (status === "completed") {
      updateFields.paymentStatus = "paid";
    } else if (status) {
      updateFields.paymentStatus = "pending";
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true } 
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng để cập nhật" });
    }
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server khi cập nhật trạng thái" });
  }
});
export default orderRouter;
import { Request, Response } from "express";
import Order from "../models/Order";

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("userId", "name fullName email phone");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng" });
  }
};


export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;


    const { lateFee, damageFee, status, paymentStatus } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        lateFee,
        damageFee,
        status,
        paymentStatus
      },
      { new: true }
    ).populate("userId", "name fullName email phone");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Cập nhật thất bại, không tìm thấy đơn hàng" });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi cập nhật đơn hàng" });
  }
};
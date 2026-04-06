import { Request, Response } from "express";
import Review from "../models/review.model";
import Order from "../models/Order";

export const createReview = async (req: Request, res: Response) => {
  try {
    const { productId, userId, rating, comment } = req.body;

    // Kiểm tra xem user đã thuê sản phẩm này và đã giao/hoàn thành chưa
    const order = await Order.findOne({
      userId: userId,
      status: { $in: ["delivered", "completed"] }, // 👈 SỬA: cho phép cả delivered và completed
      "items.productId": productId,
    });

    if (!order) {
      return res.status(400).json({
        message: "Bạn chỉ có thể đánh giá sản phẩm sau khi đã nhận hàng và hoàn thành đơn thuê",
      });
    }

    // Kiểm tra xem đã đánh giá sản phẩm này trong đơn hàng này chưa
    const existingReview = await Review.findOne({
      productId,
      userId,
      orderId: order._id,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi",
      });
    }

    const review = await Review.create({
      productId,
      userId,
      orderId: order._id,
      rating,
      comment,
      status: true,
    });

    res.status(201).json({
      success: true,
      message: "Đánh giá thành công",
      review,
    });
  } catch (error) {
    console.error("Lỗi tạo review:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const toggleReviewStatus = async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.status = !review.status;
    await review.save();

    res.json(review);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({
      productId,
      status: true,
    }).populate("userId", "fullName name");

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy đánh giá" });
  }
};

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find()
      .populate("productId", "name")
      .populate("userId", "fullName name");

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy đánh giá" });
  }
};

export const updateReviewStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(
      id,
      { status: req.body.status },
      { new: true }
    );
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật" });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted review" });
  } catch (error) {
    res.status(500).json(error);
  }
};
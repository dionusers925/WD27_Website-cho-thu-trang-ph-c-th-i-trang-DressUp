import { Request, Response } from "express";
import Review from "../models/review.model";
import Order from "../models/Order";

export const createReview = async (req: Request, res: Response) => {
  try {
    const { productId, userId, rating, comment } = req.body;

    const order = await Order.findOne({
      userId,
      status: "completed",
      "items.productId": productId,
    });

    if (!order) {
      return res.status(400).json({
        message: "Bạn phải thuê và trả sản phẩm trước khi đánh giá",
      });
    }

    const review = await Review.create({
      productId,
      userId,
      orderId: order._id,
      rating,
      comment,
    });

    res.json(review);
  } catch (error) {
    res.status(500).json(error);
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
  const { productId } = req.params;

  const reviews = await Review.find({
  productId,
  status: true,
}).populate("userId", "fullName");

  res.json(reviews);
};

export const getAllReviews = async (req: Request, res: Response) => {
  const reviews = await Review.find()
    .populate("productId", "name")
    .populate("userId", "fullName");

  res.json(reviews);
};

export const updateReviewStatus = async (req: Request, res: Response) => {
  const { id } = req.params;

  const review = await Review.findByIdAndUpdate(
    id,
    { status: req.body.status },
    { new: true }
  );

  res.json(review);
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    await Review.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted review" });
  } catch (error) {
    res.status(500).json(error);
  }
};
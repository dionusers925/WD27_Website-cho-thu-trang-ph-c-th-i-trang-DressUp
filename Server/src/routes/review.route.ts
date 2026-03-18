import express from "express";
import {
  createReview,
  getProductReviews,
  getAllReviews,
  toggleReviewStatus,
  deleteReview,
} from "../controllers/review.controller";

const router = express.Router();

router.post("/", createReview);

router.get("/product/:productId", getProductReviews);

// ADMIN
router.get("/", getAllReviews);
router.patch("/:id/status", toggleReviewStatus);
router.delete("/:id", deleteReview);

export default router;
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    userId: {
  type: String
},
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: Number,
    comment: String,
    status: {
  type: Boolean,
  default: true
}
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    deposit: Number,
    size: [String],
    images: [String],
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    description: String,
    quantity: Number,
    status: String,
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);

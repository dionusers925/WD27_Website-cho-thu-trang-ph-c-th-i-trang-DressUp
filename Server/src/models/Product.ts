import mongoose, { Schema, Document } from "mongoose";

interface RentalTier {
  days: number;
  price: number;
}
interface Variant {
  size: string;
  color: string;
}

export interface ProductDocument extends Document {
  name: string;
  rentalTiers: RentalTier[];
  images: string[];
  depositDefault: number;
  variants: Variant[];
  categoryId: mongoose.Types.ObjectId;
  description?: string;
  quantity?: number;
  status?: string;
}

const rentalTierSchema = new Schema<RentalTier>({
  days: Number,
  price: Number,
});

const productSchema = new Schema<ProductDocument>({
  name: String,

  rentalTiers: [rentalTierSchema], // ⭐ thêm field này

  images: [String],

  depositDefault: Number,

  variants: [
    {
      size: String,
      color: String,
    },
  ],

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },

  description: String,
  quantity: Number,
  status: String,
});

export default mongoose.model<ProductDocument>("Product", productSchema);

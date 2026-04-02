import mongoose, { Schema, Document } from "mongoose";

export interface RentalPrice {
  days: number;
  price: number;
}
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
  slug: string;
  rentalTiers: RentalTier[];
  variants: Variant[];
  categoryId: mongoose.Types.ObjectId;

  description?: string;

  brand?: string;
  material?: string;
  colorGroup?: string;

  condition?: string;

  tags?: string[];

  careInstruction?: string;
  internalNote?: string;

  images?: string[];

  depositPrice?: number;

  rentalPrices?: RentalPrice[];

  status?: string;
}

const rentalPriceSchema = new Schema<RentalPrice>({
  days: Number,
  price: Number,
});
const rentalTierSchema = new Schema<RentalTier>({
  days: Number,
  price: Number,
});

const productSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rentalTiers: [rentalTierSchema],
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    variants: [
      {
        size: String,
        color: String,
      },
    ],

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: String,

    brand: String,

    material: String,

    colorGroup: String,

    condition: {
      type: String,
      default: "new",
    },

    tags: {
      type: [String],
      default: [],
    },

    careInstruction: String,

    internalNote: String,

    images: {
      type: [String],
      default: [],
    },

    depositPrice: {
      type: Number,
      default: 0,
    },

    rentalPrices: {
      type: [rentalPriceSchema],
      default: [],
    },

    status: {
      type: String,
      default: "active",
    },
  },
  { timestamps: true },
);

export default mongoose.model<ProductDocument>("Product", productSchema);

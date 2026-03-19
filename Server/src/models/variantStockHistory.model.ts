import mongoose, { Schema, Document } from "mongoose";

export interface VariantStockHistoryDocument extends Document {
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId;
  sku: string;
  size?: string;
  color?: string;
  oldStock: number;
  newStock: number;
  change: number;
  action: string;
  note?: string;
}

const variantStockHistorySchema = new Schema<VariantStockHistoryDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "Variant",
    },
    sku: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    oldStock: {
      type: Number,
      default: 0,
    },
    newStock: {
      type: Number,
      default: 0,
    },
    change: {
      type: Number,
      default: 0,
    },
    action: {
      type: String,
      default: "update",
    },
    note: String,
  },
  { timestamps: true }
);

variantStockHistorySchema.index({ productId: 1, sku: 1, createdAt: -1 });

export default mongoose.model<VariantStockHistoryDocument>(
  "VariantStockHistory",
  variantStockHistorySchema
);

import mongoose, { Schema, Document } from "mongoose";

export interface VariantAttribute {
  attributeId?: mongoose.Types.ObjectId;
  attributeName: string;
  value: string;
}

export interface VariantDocument extends Document {
  productId: mongoose.Types.ObjectId;

  sku: string;

  size: string;

  color: string;

  attributes: VariantAttribute[];

  stock: number;

  reservedStock: number;

  soldStock: number;

  images: string[];

  isDefault: boolean;

  status: string;
}

const attributeSchema = new Schema<VariantAttribute>({
  attributeId: {
    type: Schema.Types.ObjectId,
    ref: "Attribute",
  },
  attributeName: String,
  value: String,
});

const variantSchema = new Schema<VariantDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
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

    attributes: [attributeSchema],

    stock: {
      type: Number,
      default: 1,
    },

    reservedStock: {
      type: Number,
      default: 0,
    },

    soldStock: {
      type: Number,
      default: 0,
    },

    images: [String],

    isDefault: Boolean,

    status: {
      type: String,
      default: "active",
    },
  },
  { timestamps: true }
);

variantSchema.index({ productId: 1, sku: 1 }, { unique: true });

export default mongoose.model<VariantDocument>("Variant", variantSchema);

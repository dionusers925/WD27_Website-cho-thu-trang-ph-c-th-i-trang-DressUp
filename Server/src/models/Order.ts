import mongoose, { Schema, Document } from "mongoose";

// Item trong order
interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

// Định nghĩa Order
export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;

  items: IOrderItem[];

  shippingAddress: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  };

  subtotal: number;
  serviceFee: number;
  total: number;

  paymentMethod: string;
  paymentStatus: string;

  status:
    | "pending"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "completed"
    | "cancelled";

  createdAt: Date;
  updatedAt: Date;
}

// Schema item
const orderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
});

// Schema order
const orderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    orderNumber: { type: String, required: true, unique: true },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    shippingAddress: {
      name: String,
      phone: String,
      address: String,
      city: String,
    },

    subtotal: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    total: { type: Number, required: true },

    paymentMethod: { type: String, default: "cod" },
    paymentStatus: { type: String, default: "pending" },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", orderSchema);
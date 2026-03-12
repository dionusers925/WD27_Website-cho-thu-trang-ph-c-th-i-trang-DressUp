import mongoose, { Schema, Document } from "mongoose";

// Định nghĩa Interface để TypeScript hiểu cấu trúc dữ liệu
export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: any[];
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

const orderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, required: true, unique: true },
    items: { type: Array, required: true },
    shippingAddress: {
      subtotal: Number,
      discount: Number,
      shippingFee: Number,
      serviceFee: Number,
      totalDeposit: Number,
      total: Number,
    },
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
    statusHistory: { type: Array }, // Lưu lịch sử thay đổi trạng thái như trong ảnh
  },
  { timestamps: true }, // Tự động tạo createdAt và updatedAt
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);

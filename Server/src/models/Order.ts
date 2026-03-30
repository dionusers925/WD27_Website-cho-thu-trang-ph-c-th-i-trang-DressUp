import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name?: string;
  size?: string;
  color?: string;
  deposit?: number;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;

  items: IOrderItem[];

  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  bankName?: string;
  bankAccount?: string;
  note?: string;

  shippingAddress?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  };

  startDate?: Date;
  endDate?: Date;

  subtotal: number;
  serviceFee: number;


  lateFee: number;
  damageFee: number;
  overdueDays?: number;
  damageErrors?: string[];
  lostItems?: string[];


  total: number;

  paymentMethod: string;
  paymentStatus: string;

  status:
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "fee_incurred"
  | "completed"
  | "cancelled";

  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  size: String,
  color: String,
  deposit: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
});

const orderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    orderNumber: { type: String, required: true, unique: true },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    customerName: String,
    customerPhone: String,
    customerAddress: String,
    bankName: String,
    bankAccount: String,
    note: String,

    shippingAddress: {
      name: String,
      phone: String,
      address: String,
      city: String,
    },

    startDate: Date,
    endDate: Date,

    subtotal: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },

    lateFee: { type: Number, default: 0 },
    damageFee: { type: Number, default: 0 },
    overdueDays: { type: Number, default: 0 },
    damageErrors: { type: [String], default: [] },
    lostItems: { type: [String], default: [] },

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
        "fee_incurred",
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
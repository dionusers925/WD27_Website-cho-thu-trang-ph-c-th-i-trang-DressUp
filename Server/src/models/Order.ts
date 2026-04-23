import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId;
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
  bankHolder?: string;
  note?: string;

  shippingAddress?: {
    address?: string;
    name?: string;
    phone?: string;
    city?: string;
    receiverName?: string;
    receiverPhone?: string;
    line1?: string;
    ward?: string;
    district?: string;
    province?: string;
    country?: string;
  };

  startDate?: Date;
  endDate?: Date;

  subtotal: number;
  serviceFee: number;
  lateDays?: number;
  lateFee?: number;
  damageFee?: number;
  penaltyNote?: string;
  overdueDays?: number;
  damageErrors?: string[];
  lostItems?: string[];
  total: number;

  paymentMethod: string;
  paymentStatus: string;

  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "shipped"
    | "delivered"
    | "renting"
    | "returning"
    | "picked_up"
    | "returned"
    | "fee_incurred"
    | "completed"
    | "laundry"
    | "cancelled";

  deliveryProof?: string;
  returnMedia?: string[];
  adminReturnMedia?: string[];
  depositReturnProof?: string;

  vnpTransactionNo?: string;

  statusHistory?: Array<{ status: string; updatedBy?: string; date: Date }>;
  paymentStatusHistory?: Array<{ status: string; updatedBy?: string; date: Date }>;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: Schema.Types.ObjectId, ref: "Variant" },
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
    bankHolder: String,
    note: String,

    shippingAddress: {
      receiverName: String,
      receiverPhone: String,
      line1: String,
      ward: String,
      district: String,
      province: String,
      country: String,
    },

    startDate: Date,
    endDate: Date,

    subtotal: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    damageFee: { type: Number, default: 0 },
    penaltyNote: { type: String },
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
        "preparing",
        "shipped",
        "delivered",
        "renting",
        "returning",
        "picked_up",
        "returned",
        "fee_incurred",
        "completed",
        "laundry",
        "cancelled",
      ],
      default: "pending",
    },

    deliveryProof: { type: String, default: "" },
    returnMedia: { type: [String], default: [] },
    adminReturnMedia: { type: [String], default: [] },
    depositReturnProof: { type: String, default: "" },

    vnpTransactionNo: { type: String, default: "" },

    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
        updatedBy: String,
      },
    ],

    paymentStatusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
        updatedBy: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", orderSchema);

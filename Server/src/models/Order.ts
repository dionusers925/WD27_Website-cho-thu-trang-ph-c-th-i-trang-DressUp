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

  rentalDays?: number;     
  originalEndDate?: Date;    

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
  | "returning"
  | "returned"
  | "renting"
  | "extended"
  | "shortened"
  | "fee_incurred"
  | "completed"
  | "cancelled";

  vnpTransactionNo?: string;

  statusHistory?: Array<{ status: string; updatedBy?: string; date: Date; note?: string }>;
  paymentStatusHistory?: Array<{ status: string; updatedBy?: string; date: Date }>;

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
    rentalDays: { type: Number, default: 0 },           
    originalEndDate: { type: Date, default: null },   

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
      status: {
  type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "returning",
        "returned",
        "renting",
        "extended",
        "shortened",
        "fee_incurred",
        "completed",
        "cancelled",
      ],
  default: "pending",
},
      default: "pending",
    },

    vnpTransactionNo: { type: String, default: "" },

    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
        updatedBy: String,
        note: String,     
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
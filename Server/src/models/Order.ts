import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItemRental {
  startDate: Date;
  endDate: Date;
  days: number;
  pricePerDay: number;
}

export interface IOrderItemVariant {
  size: string;
  color: string;
}

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  image?: string;
  rental: IOrderItemRental;
  variant: IOrderItemVariant;
  deposit: number;
  quantity: number;
  lineTotal: number;
}

export interface IShippingAddress {
  receiverName: string;
  receiverPhone: string;
  line1: string;
  ward?: string;
  district?: string;
  province?: string;
  country?: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];

  customerInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    note?: string;
  };

  shippingAddress?: IShippingAddress;

  subtotal: number;
  discount: number;
  shippingFee: number;
  serviceFee: number;
  couponDiscount: number;
  totalDeposit: number;
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
    | "in_warehouse"
    | "cancelled";

  // media & proof
  deliveryProof?: string;
  returnMedia?: string[];
  adminReturnMedia?: string[];
  depositReturnProof?: string;

  vnpTransactionNo?: string;

  // history
  statusHistory?: Array<{
    status: string;
    updatedBy?: string;
    date: Date;
  }>;

  paymentStatusHistory?: Array<{
    status: string;
    updatedBy?: string;
    date: Date;
  }>;

  // business fields từ HEAD
  notes?: string;
  pickupDeadline?: Date;
  lateFee: number;
  depositRefunded?: number;

  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  actualReturnDate?: Date;
  returnedAt?: Date;
  inspectedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ===== Sub schemas =====
const orderItemRentalSchema = new Schema<IOrderItemRental>({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true },
  pricePerDay: { type: Number, required: true }
});

const orderItemVariantSchema = new Schema<IOrderItemVariant>({
  size: { type: String, required: true },
  color: { type: String, required: true }
});

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: String,
  rental: { type: orderItemRentalSchema, required: true },
  variant: { type: orderItemVariantSchema, required: true },
  deposit: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  lineTotal: { type: Number, required: true }
});

const shippingAddressSchema = new Schema<IShippingAddress>({
  receiverName: { type: String, required: true },
  receiverPhone: { type: String, required: true },
  line1: { type: String, required: true },
  ward: String,
  district: String,
  province: String,
  country: String
});

// ===== Main schema =====
const orderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, required: true, unique: true },

    items: { type: [orderItemSchema], required: true },

    shippingAddress: { type: shippingAddressSchema },

    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    totalDeposit: { type: Number, default: 0 },
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
        "in_warehouse",
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

    // giữ từ HEAD
    notes: String,
    pickupDeadline: Date,
    lateFee: { type: Number, default: 0 },
    depositRefunded: Number,

    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    actualReturnDate: Date,
    returnedAt: Date,
    inspectedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", orderSchema);
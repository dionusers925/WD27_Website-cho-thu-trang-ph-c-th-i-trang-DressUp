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

export interface IStatusHistory {
  status: string;
  timestamp: Date;
  changedBy: string;
  notes?: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
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
  status: string;
  statusHistory: IStatusHistory[];
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

// Sub-schemas
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
  image: { type: String },
  rental: { type: orderItemRentalSchema, required: true },
  variant: { type: orderItemVariantSchema, required: true },
  deposit: { type: Number, required: true, default: 0 },
  quantity: { type: Number, required: true, default: 1 },
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

const statusHistorySchema = new Schema<IStatusHistory>({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  changedBy: { type: String, required: true },
  notes: String
});

// Main Order Schema
const orderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, required: true, unique: true },
    
    items: { type: [orderItemSchema], required: true },
    
    shippingAddress: { type: shippingAddressSchema },
    
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    totalDeposit: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    
    paymentMethod: { type: String, default: "cod" },
    paymentStatus: { type: String, default: "pending" },
    
    status: { type: String, default: "pending" },
    
    statusHistory: { type: [statusHistorySchema], default: [] },
    
    notes: { type: String },
    
    pickupDeadline: Date,
    
    lateFee: { type: Number, default: 0 },
    depositRefunded: { type: Number },
    
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    actualReturnDate: Date,
    returnedAt: Date,
    inspectedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", orderSchema);
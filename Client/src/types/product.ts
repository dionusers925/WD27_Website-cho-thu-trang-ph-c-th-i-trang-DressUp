import { type ICategory } from "./category";

export interface RentalPrice {
  days: number;
  price: number;
}

export interface ProductVariant {
  _id?: string;
  size: string;
  color: string;
  sku: string;
  stock?: number;
}

export interface VariantStockHistory {
  _id: string;
  productId: string;
  variantId?: string;
  sku: string;
  size?: string;
  color?: string;
  oldStock: number;
  newStock: number;
  change: number;
  action?: string;
  note?: string;
  createdAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  categoryId?: ICategory;
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
  variants?: ProductVariant[];
  variantCount?: number;
  status?: "active" | "draft" | "archived";
  createdAt?: string;
  updatedAt?: string;
}

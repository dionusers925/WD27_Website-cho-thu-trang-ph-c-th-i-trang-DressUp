import { ICategory } from "./category";

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
  status?: "active" | "draft" | "archived";
  createdAt?: string;
  updatedAt?: string;
}
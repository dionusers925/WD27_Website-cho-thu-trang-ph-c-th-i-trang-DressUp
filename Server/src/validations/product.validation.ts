import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const rentalPriceSchema = z.object({
  days: z.coerce.number().int().positive(),
  price: z.coerce.number().min(0),
});

export const variantSchema = z.object({
  sku: z.string().min(1),
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.coerce.number().int().min(0).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(slugRegex).optional(),
  categoryId: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  material: z.string().optional(),
  colorGroup: z.string().optional(),
  condition: z.string().optional(),
  tags: z.array(z.string()).optional(),
  careInstruction: z.string().optional(),
  internalNote: z.string().optional(),
  images: z.array(z.string()).optional(),
  depositPrice: z.coerce.number().min(0),
  rentalPrices: z.array(rentalPriceSchema).min(1),
  variants: z.array(variantSchema).min(1),
  status: z.enum(["active", "draft", "archived"]).optional(),
});

export const updateProductSchema = createProductSchema.partial();

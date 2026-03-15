import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/product.model";
import Variant from "../models/variant.model";
import Category from "../models/Category";
import { createProductSchema } from "../validations/product.validation";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const ensureUniqueSlug = async (baseSlug: string, excludeId?: string) => {
  let slug = baseSlug;
  let counter = 0;
  while (true) {
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await Product.findOne(query).select("_id");
    if (!existing) return slug;
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};

const ensureUniqueSku = (variants: any[]) => {
  const set = new Set<string>();
  for (const v of variants) {
    const sku = String(v.sku || "").trim();
    if (!sku) continue;
    if (set.has(sku)) return false;
    set.add(sku);
  }
  return true;
};

const buildVariantDocs = (variants: any[], productId: any) =>
  variants.map((v) => ({
    productId,
    sku: String(v.sku ?? "").trim(),
    size: String(v.size ?? "").trim(),
    color: String(v.color ?? "").trim(),
    stock: v.stock ?? 1,
    attributes: [
      { attributeName: "Size", value: String(v.size ?? "").trim() },
      { attributeName: "Color", value: String(v.color ?? "").trim() },
    ],
  }));

export const createProduct = async (req: Request, res: Response) => {
  try {
    const validated = createProductSchema.parse(req.body);

    const baseSlug = slugify(validated.slug ?? validated.name);
    const slug = await ensureUniqueSlug(baseSlug);
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const category = await Category.findById(validated.categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!ensureUniqueSku(validated.variants)) {
      return res.status(400).json({
        success: false,
        message: "SKU must be unique",
      });
    }

    const { variants, ...productData } = validated;
    const normalized = {
      ...productData,
      slug,
      tags: (productData.tags ?? []).map((t) => t.trim()).filter(Boolean),
      images: (productData.images ?? []).map((i) => i.trim()).filter(Boolean),
    };
    const product = await Product.create(normalized);

    const variantDocs = buildVariantDocs(variants, product._id);
    const createdVariants = await Variant.insertMany(variantDocs);

    res.status(201).json({
      success: true,
      data: {
        product,
        variants: createdVariants,
      },
    });
  } catch (error: any) {
    const zodMessage = error?.issues?.[0]?.message;
    res.status(400).json({
      success: false,
      message: zodMessage ?? error.message ?? "Validation error",
      errors: error?.issues ?? undefined,
    });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const limit = Math.max(1, Number(req.query.limit ?? 10) || 10);
    const search = String(req.query.search ?? "").trim();

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .populate("categoryId")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
};

export const getProductDetail = async (req: Request, res: Response) => {
  try {
    const param = req.params.id;
    let product = null;
    if (mongoose.Types.ObjectId.isValid(param)) {
      product = await Product.findById(param).populate("categoryId");
    }
    if (!product) {
      product = await Product.findOne({ slug: param }).populate("categoryId");
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const variants = await Variant.find({
      productId: product._id,
    });

    res.json({
      success: true,
      data: {
        product,
        variants,
      },
    });
  } catch (error) {
    res.status(404).json({
      success: false,
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const validated = createProductSchema.parse(req.body);
    const baseSlug = slugify(validated.slug ?? validated.name);
    const slug = await ensureUniqueSlug(baseSlug, req.params.id);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const category = await Category.findById(validated.categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!ensureUniqueSku(validated.variants)) {
      return res.status(400).json({
        success: false,
        message: "SKU must be unique",
      });
    }

    const { variants, ...productData } = validated;
    const normalized = {
      ...productData,
      slug,
      tags: (productData.tags ?? []).map((t) => t.trim()).filter(Boolean),
      images: (productData.images ?? []).map((i) => i.trim()).filter(Boolean),
    };

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      normalized,
      { returnDocument: "after" }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Variant.deleteMany({
      productId: req.params.id,
    });

    const variantDocs = buildVariantDocs(variants, req.params.id);
    const newVariants = await Variant.insertMany(variantDocs);

    res.json({
      success: true,
      data: {
        product,
        variants: newVariants,
      },
    });
  } catch (error: any) {
    const zodMessage = error?.issues?.[0]?.message;
    res.status(400).json({
      success: false,
      message: zodMessage ?? error.message ?? "Validation error",
      errors: error?.issues ?? undefined,
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await Variant.deleteMany({
      productId: req.params.id,
    });

    res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
};


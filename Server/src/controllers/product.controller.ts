import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/product.model";
import Variant from "../models/variant.model";
import VariantStockHistory from "../models/variantStockHistory.model";
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

const normalizeSku = (value: any) => String(value ?? "").trim();

const buildVariantDocs = (variants: any[], productId: any) =>
  variants.map((v) => ({
    productId,
    sku: normalizeSku(v.sku),
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
    if (createdVariants.length > 0) {
      const historyDocs = createdVariants.map((variant) => {
        const newStock = Number(variant.stock ?? 0);
        return {
          productId: product._id,
          variantId: variant._id,
          sku: normalizeSku(variant.sku),
          size: String(variant.size ?? "").trim(),
          color: String(variant.color ?? "").trim(),
          oldStock: 0,
          newStock,
          change: newStock,
          action: "initial",
        };
      });
      await VariantStockHistory.insertMany(historyDocs);
    }

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
      .sort({ createdAt: -1 })
      .lean();

    const productIds = products.map((p) => p._id);
    const variantCounts =
      productIds.length > 0
        ? await Variant.aggregate([
            { $match: { productId: { $in: productIds } } },
            { $group: { _id: "$productId", count: { $sum: 1 } } },
          ])
        : [];
    const variantCountMap = new Map<string, number>(
      variantCounts.map((item) => [String(item._id), item.count])
    );
    const productsWithCounts = products.map((product) => ({
      ...product,
      variantCount: variantCountMap.get(String(product._id)) ?? 0,
    }));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products: productsWithCounts,
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

export const getVariantStockHistory = async (req: Request, res: Response) => {
  try {
    const param = req.params.id;
    let product: any = null;
    if (mongoose.Types.ObjectId.isValid(param)) {
      product = await Product.findById(param).select("_id");
    }
    if (!product) {
      product = await Product.findOne({ slug: param }).select("_id");
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const limit = Math.max(1, Number(req.query.limit ?? 10) || 10);
    const sku = String(req.query.sku ?? "").trim();
    const action = String(req.query.action ?? "").trim();

    const query: any = { productId: product._id };
    if (sku) {
      query.sku = { $regex: sku, $options: "i" };
    }
    if (action) {
      query.action = action;
    }

    const total = await VariantStockHistory.countDocuments(query);
    const items = await VariantStockHistory.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: {
        items,
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

    const existingVariants = await Variant.find({
      productId: req.params.id,
    }).lean();
    const existingBySku = new Map<string, any>();
    existingVariants.forEach((variant) => {
      const skuKey = normalizeSku(variant.sku);
      if (skuKey) {
        existingBySku.set(skuKey, variant);
      }
    });

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
    const historyDocs: any[] = [];
    const newSkuSet = new Set<string>();

    newVariants.forEach((variant) => {
      const skuKey = normalizeSku(variant.sku);
      if (!skuKey) return;
      newSkuSet.add(skuKey);
      const oldVariant = existingBySku.get(skuKey);
      const newStock = Number(variant.stock ?? 0);
      if (oldVariant) {
        const oldStock = Number(oldVariant.stock ?? 0);
        if (oldStock !== newStock) {
          historyDocs.push({
            productId: product._id,
            variantId: variant._id,
            sku: skuKey,
            size: String(variant.size ?? "").trim(),
            color: String(variant.color ?? "").trim(),
            oldStock,
            newStock,
            change: newStock - oldStock,
            action: "update",
          });
        }
      } else {
        historyDocs.push({
          productId: product._id,
          variantId: variant._id,
          sku: skuKey,
          size: String(variant.size ?? "").trim(),
          color: String(variant.color ?? "").trim(),
          oldStock: 0,
          newStock,
          change: newStock,
          action: "added",
        });
      }
    });

    existingVariants.forEach((variant) => {
      const skuKey = normalizeSku(variant.sku);
      if (!skuKey || newSkuSet.has(skuKey)) return;
      const oldStock = Number(variant.stock ?? 0);
      if (oldStock === 0) return;
      historyDocs.push({
        productId: product._id,
        variantId: variant._id,
        sku: skuKey,
        size: String(variant.size ?? "").trim(),
        color: String(variant.color ?? "").trim(),
        oldStock,
        newStock: 0,
        change: -oldStock,
        action: "removed",
      });
    });

    if (historyDocs.length > 0) {
      await VariantStockHistory.insertMany(historyDocs);
    }

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


import express from "express";
import { verifyToken } from "../middleware/auth";
import { isAdmin } from "../middleware/isAdmin";

import {
  createProduct,
  getProducts,
  getProductDetail,
  getVariantStockHistory,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";

const router = express.Router();

router.get("/", getProducts);

router.get("/:id/variant-history", getVariantStockHistory);

router.get("/:id", getProductDetail);

router.post("/", createProduct);

router.put("/:id", updateProduct);

router.delete("/:id", deleteProduct);

router.post("/", verifyToken, isAdmin, createProduct);
router.put("/:id", verifyToken, isAdmin, updateProduct);
router.delete("/:id", verifyToken, isAdmin, deleteProduct);

export default router;

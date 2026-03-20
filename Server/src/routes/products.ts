import express from "express"

import {

createProduct,
getProducts,
getProductDetail,
getVariantStockHistory,
updateProduct,
deleteProduct

} from "../controllers/product.controller"

const router = express.Router()

router.get("/", getProducts)

router.get("/:id/variant-history", getVariantStockHistory)

router.get("/:id", getProductDetail)

router.post("/", createProduct)

router.put("/:id", updateProduct)

router.delete("/:id", deleteProduct)

export default router

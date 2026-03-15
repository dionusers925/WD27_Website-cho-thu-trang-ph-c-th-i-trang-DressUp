import express from "express"

import {

createProduct,
getProducts,
getProductDetail,
updateProduct,
deleteProduct

} from "../controllers/product.controller"

const router = express.Router()

router.get("/", getProducts)

router.get("/:id", getProductDetail)

router.post("/", createProduct)

router.put("/:id", updateProduct)

router.delete("/:id", deleteProduct)

export default router
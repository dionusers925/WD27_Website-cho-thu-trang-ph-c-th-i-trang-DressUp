import express from "express";
import { checkout, createPaymentUrl, paymentSuccess, createExtendPaymentUrl } from "../controllers/payment.controller";

const router = express.Router();

router.post("/checkout", checkout);
router.post("/create-payment-url", createPaymentUrl);  
router.post("/payment-success", paymentSuccess);       
router.post("/create-extend-payment-url", createExtendPaymentUrl);  // 👈 THÊM DÒNG NÀY

export default router;
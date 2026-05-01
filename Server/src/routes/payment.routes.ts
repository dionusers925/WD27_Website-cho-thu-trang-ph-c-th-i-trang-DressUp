import express from "express";
import { checkout, createPaymentUrl, paymentSuccess } from "../controllers/payment.controller";

const router = express.Router();

router.post("/checkout", checkout);
router.post("/create-payment-url", createPaymentUrl);  
router.post("/payment-success", paymentSuccess);       

export default router;
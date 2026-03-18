import express from "express";
import Costume from "../models/Costume";

const router = express.Router();

router.get("/costumes", async (req, res) => {
  try {
    const costumes = await Costume.find();
    res.json(costumes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;

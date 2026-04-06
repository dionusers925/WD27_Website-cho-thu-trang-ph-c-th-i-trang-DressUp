import { Router } from "express";
import User from "../models/User";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

export default router;

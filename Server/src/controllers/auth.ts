import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "dressup_secret";

export const register = async (req: any, res: any) => {
  try {
    const { email, name, phone, password } = req.body;

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    const existPhone = await User.findOne({ phone });
    if (existPhone) {
      return res.status(400).json({
        message: "Số điện thoại đã tồn tại",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      name,
      phone,
      password: hash,
    });

    res.json({
      message: "Đăng ký thành công",
      user,
    });
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];

      return res.status(400).json({
        message: `${field} đã tồn tại`,
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const login = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    const user: any = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

import jwt from "jsonwebtoken";

export const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

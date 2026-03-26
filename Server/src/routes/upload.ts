import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();
const UPLOAD_DIR = path.resolve("uploads");

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);

router.post("/api/uploads", (req, res) => {
  const { dataUrl, fileName } = req.body ?? {};
  if (typeof dataUrl !== "string") {
    return res.status(400).json({ message: "Missing dataUrl" });
  }

  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ message: "Invalid dataUrl" });
  }

  const mime = match[1];
  const base64 = match[2];
  const ext = mime.split("/")[1] || "png";
  const baseName = sanitizeFileName(
    fileName && typeof fileName === "string"
      ? fileName
      : `upload-${Date.now()}.${ext}`
  );

  const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const fileBase = `${uniquePrefix}-${baseName}`;
  const finalName = fileBase.toLowerCase().endsWith(`.${ext}`)
    ? fileBase
    : `${fileBase}.${ext}`;

  try {
    ensureUploadDir();
    const filePath = path.join(UPLOAD_DIR, finalName);
    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(filePath, buffer);
    const url = `${req.protocol}://${req.get("host")}/uploads/${finalName}`;
    return res.json({ url });
  } catch (error) {
    return res.status(500).json({ message: "Upload failed" });
  }
});

export default router;

import express from "express";
import Attribute from "../models/attribute.model";
import Variant from "../models/variant.model";
import {
  createAttributeSchema,
  updateAttributeSchema,
} from "../validations/attribute.validate";

const router = express.Router();

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findAttributeByName = async (name: string, excludeId?: string) => {
  const regex = new RegExp(`^${escapeRegExp(name)}$`, "i");
  const query: any = { name: regex };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return Attribute.findOne(query);
};

router.get("/", async (_req, res) => {
  try {
    const attributes = await Attribute.find().sort({ createdAt: -1 });
    res.json(attributes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);

    if (!attribute) {
      return res.status(404).json({ message: "Không tìm thấy thuộc tính" });
    }

    res.json(attribute);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { error } = createAttributeSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const name = String(req.body.name ?? "").trim();
    const slug = String(req.body.slug ?? "").trim();

    const existName = await findAttributeByName(name);
    if (existName) {
      return res.status(400).json({ message: "Tên đã tồn tại" });
    }

    const existSlug = await Attribute.findOne({ slug });
    if (existSlug) {
      return res.status(400).json({ message: "Slug đã tồn tại" });
    }

    const attribute = await Attribute.create({
      ...req.body,
      name,
      slug,
    });

    res.json(attribute);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { error } = updateAttributeSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updateData: any = { ...req.body };

    if (typeof req.body.name === "string") {
      const name = req.body.name.trim();
      const existName = await findAttributeByName(name, req.params.id);
      if (existName) {
        return res.status(400).json({ message: "Tên đã tồn tại" });
      }
      updateData.name = name;
    }

    if (typeof req.body.slug === "string") {
      const slug = req.body.slug.trim();
      const existSlug = await Attribute.findOne({
        slug,
        _id: { $ne: req.params.id },
      });
      if (existSlug) {
        return res.status(400).json({ message: "Slug đã tồn tại" });
      }
      updateData.slug = slug;
    }

    const attribute = await Attribute.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: "after" }
    );

    if (!attribute) {
      return res.status(404).json({ message: "Không tìm thấy thuộc tính" });
    }

    res.json(attribute);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);

    if (!attribute) {
      return res.status(404).json({ message: "Không tìm thấy thuộc tính" });
    }

    await Variant.updateMany(
      { "attributes.attributeId": attribute._id },
      {
        $set: { "attributes.$[elem].attributeName": attribute.name },
        $unset: { "attributes.$[elem].attributeId": "" },
      },
      {
        arrayFilters: [{ "elem.attributeId": attribute._id }],
      }
    );

    await Attribute.findByIdAndDelete(req.params.id);

    res.json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;

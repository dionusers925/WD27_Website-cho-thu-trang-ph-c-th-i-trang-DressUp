import { Request, Response } from "express";
import Attribute from "../models/attribute.model";
import { createAttributeSchema, updateAttributeSchema } from "../validations/attribute.validate";

export const createAttribute = async (req: Request, res: Response) => {
  const { error } = createAttributeSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const attribute = await Attribute.create(req.body);
  res.status(201).json(attribute);
};

export const getAttributes = async (_req: Request, res: Response) => {
  const attributes = await Attribute.find().sort({ createdAt: -1 });
  res.json(attributes);
};

export const getAttributeById = async (req: Request, res: Response) => {
  const attribute = await Attribute.findById(req.params.id);
  if (!attribute) return res.status(404).json({ message: "Attribute not found" });

  res.json(attribute);
};

export const updateAttribute = async (req: Request, res: Response) => {
  const { error } = updateAttributeSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const attribute = await Attribute.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  if (!attribute) return res.status(404).json({ message: "Attribute not found" });

  res.json(attribute);
};

export const deleteAttribute = async (req: Request, res: Response) => {
  const attribute = await Attribute.findByIdAndDelete(req.params.id);

  if (!attribute) return res.status(404).json({ message: "Attribute not found" });

  res.json({ message: "Attribute deleted successfully" });
};
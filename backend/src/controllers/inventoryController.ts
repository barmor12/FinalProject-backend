import { Request, Response } from "express";
import Product from "../models/inventoryModel";

export const getAllProducts = async (req: Request, res: Response) => {
  const products = await Product.find();
  res.json({ products });
};

export const updateProduct = async (req: Request, res: Response) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updatedProduct);
};

export const deleteProduct = async (req: Request, res: Response) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
};

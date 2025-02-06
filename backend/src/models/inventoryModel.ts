import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  image: string;
  description: string;
  quantity: number;
  price: number;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  image: { type: String, required: false },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
});

export default mongoose.model<IProduct>("Product", ProductSchema);

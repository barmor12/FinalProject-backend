// models/orderModel.ts
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  cake: { type: mongoose.Schema.Types.ObjectId, ref: "Cake", required: true },
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema], // <== מערך פריטים
  totalPrice: { type: Number, required: true },
  decoration: { type: String, default: "" },
  status: {
    type: String,
    enum: ["draft", "pending", "confirmed", "delivered"],
    default: "draft",
  },
  discountCode: { type: String },
  deliveryDate: { type: Date },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 30 * 24 * 60 * 60 * 1000,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Order", orderSchema);

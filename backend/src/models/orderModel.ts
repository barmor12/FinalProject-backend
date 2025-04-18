import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  cake: { type: mongoose.Schema.Types.ObjectId, ref: "Cake", required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  address: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true }, // 🔥 קישור לכתובת הלקוח
  items: [orderItemSchema],
  totalPrice: { type: Number, required: true },
  totalRevenue: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["draft", "pending", "confirmed", "delivered"],
    default: "draft",
  },
  deliveryDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);

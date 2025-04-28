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
  isPriority: { type: Boolean, default: false }, // Field to mark priority orders
  deliveryDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (value: Date) {
        return value > new Date();
      },
      message: 'Delivery date must be in the future'
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);

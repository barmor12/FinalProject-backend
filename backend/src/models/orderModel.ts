import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  cake: { type: mongoose.Schema.Types.ObjectId, ref: "Cake", required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: false,
  }, // 🔥 קישור לכתובת הלקוח
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
    required: false,
    validate: {
      validator: function (value: Date | null) {
        if (!value) return true;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dateToValidate = new Date(value);
        dateToValidate.setHours(0, 0, 0, 0);

        return dateToValidate >= today;
      },
      message: "Delivery date must be today or in the future",
    },
  },
  shippingMethod: {
    type: String,
    enum: ["Standard Delivery (2-3 days)", "Self Pickup"],
    required: false,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);

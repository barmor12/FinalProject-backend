import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cake: { type: mongoose.Schema.Types.ObjectId, ref: "Cake", required: true }, // הקשר לעוגה
  quantity: { type: Number, required: true }, // כמות עוגות בהזמנה
  totalPrice: { type: Number, required: true },
  decoration: { type: String, default: "" },
  status: {
    type: String,
    enum: ["draft", "pending", "confirmed", "delivered"],
    default: "draft", // מצב טיוטה
  },
  discountCode: { type: String }, // קוד הנחה
  deliveryDate: { type: Date }, // תאריך משלוח
  expiresAt: {
    type: Date,
    default: () => Date.now() + 30 * 24 * 60 * 60 * 1000,
  }, // 30 יום
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// לפני שמירת הזמנה, לעדכן את זמן ה-`updatedAt`
orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;

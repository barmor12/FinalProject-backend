"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const orderItemSchema = new mongoose_1.default.Schema({
    cake: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Cake", required: true },
    quantity: { type: Number, required: true },
});
const orderSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
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
exports.default = mongoose_1.default.model("Order", orderSchema);
//# sourceMappingURL=orderModel.js.map
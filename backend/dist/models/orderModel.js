"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const orderSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    cake: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Cake",
        required: true
    },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    orderDate: { type: Date, default: Date.now },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Order', orderSchema);
//# sourceMappingURL=orderModel.js.map
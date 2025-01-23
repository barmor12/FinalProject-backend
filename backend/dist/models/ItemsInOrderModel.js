"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const orderItemSchema = new mongoose_1.default.Schema({
    order: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Order', required: true },
    cake: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Cake', required: true },
    quantity: { type: Number, required: true },
});
module.exports = mongoose_1.default.model('OrderItem', orderItemSchema);
//# sourceMappingURL=ItemsInOrderModel.js.map
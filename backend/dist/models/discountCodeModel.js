"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const discountCodeSchema = new mongoose_1.default.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    expiryDate: {
        type: Date,
        required: false,
    },
}, { timestamps: true });
discountCodeSchema.methods.isValid = function () {
    if (!this.isActive)
        return false;
    if (this.expiryDate && new Date() > this.expiryDate)
        return false;
    return true;
};
exports.default = mongoose_1.default.model("DiscountCode", discountCodeSchema);
//# sourceMappingURL=discountCodeModel.js.map
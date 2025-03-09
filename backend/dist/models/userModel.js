"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profilePic: { type: String },
    phone: { type: String },
    address: { type: String },
    role: { type: String, default: "user" },
    favorites: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Cake" }],
    refresh_tokens: [String],
    isVerified: { type: Boolean, default: false },
    resetToken: { type: String },
    resetExpires: { type: Date },
}, { timestamps: true });
exports.default = mongoose_1.default.model("User", userSchema);
//# sourceMappingURL=userModel.js.map
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDiscountCode = exports.validateDiscountCode = exports.getAllDiscountCodes = exports.createDiscountCode = void 0;
const discountCodeModel_1 = __importDefault(require("../models/discountCodeModel"));
const createDiscountCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, discountPercentage, expiryDate } = req.body;
        if (!code || discountPercentage == null) {
            res.status(400).json({ message: "Code and discount are required." });
            return;
        }
        const foundCode = yield discountCodeModel_1.default.findOne({ code });
        if (foundCode) {
            res.status(409).json({ message: "Code already exists." });
            return;
        }
        const newCode = new discountCodeModel_1.default({
            code,
            discountPercentage,
            expiryDate,
        });
        yield newCode.save();
        res.status(201).json(newCode);
    }
    catch (error) {
        console.error("Error creating code:", error);
        res.status(500).json({ message: "Failed to create discount code." });
    }
});
exports.createDiscountCode = createDiscountCode;
const getAllDiscountCodes = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const codes = yield discountCodeModel_1.default.find().sort({ createdAt: -1 });
        res.json(codes);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch discount codes." });
    }
});
exports.getAllDiscountCodes = getAllDiscountCodes;
const validateDiscountCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code } = req.body;
        if (!code) {
            res.status(400).json({ message: "Code is required" });
            return;
        }
        const discountCode = yield discountCodeModel_1.default.findOne({ code });
        if (!discountCode) {
            res.status(404).json({ message: "Discount code not found" });
            return;
        }
        const now = new Date();
        const isExpired = discountCode.expiryDate && now > discountCode.expiryDate;
        if (!discountCode.isActive || isExpired) {
            res.status(400).json({ message: "Code is invalid or expired" });
            return;
        }
        res.status(200).json({
            valid: true,
            discountPercentage: discountCode.discountPercentage,
        });
    }
    catch (err) {
        console.error("[ERROR] Validating discount code:", err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.validateDiscountCode = validateDiscountCode;
const deleteDiscountCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleted = yield discountCodeModel_1.default.findByIdAndDelete(id);
        if (!deleted) {
            res.status(404).json({ message: "Discount code not found" });
            return;
        }
        res.status(200).json({ message: "Discount code deleted successfully" });
    }
    catch (err) {
        console.error("[ERROR] Deleting discount code:", err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.deleteDiscountCode = deleteDiscountCode;
//# sourceMappingURL=discountController.js.map
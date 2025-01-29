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
exports.clearCart = exports.removeFromCart = exports.getCart = exports.addToCart = void 0;
const cartModel_1 = __importDefault(require("../models/cartModel"));
const cakeModel_1 = __importDefault(require("../models/cakeModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const authController_1 = require("./authController");
const addToCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
        return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;
        const { cakeId, quantity } = req.body;
        if (!cakeId || !quantity) {
            res.status(400).json({ error: "Cake ID and quantity are required" });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(cakeId)) {
            res.status(400).json({ error: "Invalid Cake ID format" });
            return;
        }
        const cake = yield cakeModel_1.default.findById(cakeId);
        if (!cake) {
            res.status(404).json({ error: "Cake not found" });
            return;
        }
        let cart = yield cartModel_1.default.findOne({ user: userId });
        if (!cart) {
            cart = new cartModel_1.default({ user: userId, items: [] });
        }
        const existingItem = cart.items.find((item) => item.cake.toString() === cakeId);
        if (existingItem) {
            existingItem.quantity += quantity;
        }
        else {
            cart.items.push({ cake: cakeId, quantity });
        }
        const updatedCart = yield cart.save();
        res.status(200).json(updatedCart);
    }
    catch (err) {
        console.error("Failed to add cake to cart:", err);
        res.status(500).json({ error: "Failed to add cake to cart" });
    }
});
exports.addToCart = addToCart;
const getCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
        return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;
        const cart = yield cartModel_1.default.findOne({ user: userId }).populate("items.cake");
        if (!cart) {
            res.status(200).json({ items: [] });
            return;
        }
        res.status(200).json(cart);
    }
    catch (err) {
        console.error("Failed to fetch cart:", err);
        res.status(500).json({ error: "Failed to fetch cart" });
    }
});
exports.getCart = getCart;
const removeFromCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
        return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;
        const { cakeId } = req.body;
        if (!cakeId) {
            res.status(400).json({ error: "Cake ID is required" });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(cakeId)) {
            res.status(400).json({ error: "Invalid Cake ID format" });
            return;
        }
        const cart = yield cartModel_1.default.findOne({ user: userId });
        if (!cart) {
            res.status(404).json({ error: "Cart not found" });
            return;
        }
        cart.items = cart.items.filter((item) => item.cake.toString() !== cakeId);
        const updatedCart = yield cart.save();
        res.status(200).json(updatedCart);
    }
    catch (err) {
        console.error("Failed to remove cake from cart:", err);
        res.status(500).json({ error: "Failed to remove cake from cart" });
    }
});
exports.removeFromCart = removeFromCart;
const clearCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
        return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;
        const cart = yield cartModel_1.default.findOne({ user: userId });
        if (!cart) {
            res.status(404).json({ error: "Cart not found" });
            return;
        }
        cart.items = [];
        yield cart.save();
        res.status(200).json({ message: "Cart cleared successfully" });
    }
    catch (err) {
        console.error("Failed to clear cart:", err);
        res.status(500).json({ error: "Failed to clear cart" });
    }
});
exports.clearCart = clearCart;
exports.default = {
    addToCart: exports.addToCart,
    getCart: exports.getCart,
    removeFromCart: exports.removeFromCart,
    clearCart: exports.clearCart,
};
//# sourceMappingURL=cartController.js.map
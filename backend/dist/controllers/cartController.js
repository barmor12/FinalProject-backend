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
exports.clearCart = exports.removeFromCart = exports.getCart = exports.updateCartItem = exports.addToCart = void 0;
const cartModel_1 = __importDefault(require("../models/cartModel"));
const cakeModel_1 = __importDefault(require("../models/cakeModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const authController_1 = require("./authController");
const addToCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token)
        return (0, authController_1.sendError)(res, "Token required", 401);
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
        if (!cart)
            cart = new cartModel_1.default({ user: userId, items: [] });
        const existingItem = cart.items.find((item) => item.cake.toString() === cakeId);
        if (existingItem) {
            existingItem.quantity += quantity;
        }
        else {
            cart.items.push({
                cake: cakeId,
                quantity,
            });
        }
        yield cart.save();
        res.status(200).json(cart);
    }
    catch (err) {
        console.error("Failed to add cake to cart:", err);
        res.status(500).json({ error: "Failed to add cake to cart" });
    }
});
exports.addToCart = addToCart;
const updateCartItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🔹 Received request to update item:", req.body);
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token)
        return (0, authController_1.sendError)(res, "Token required", 401);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;
        const { itemId, quantity } = req.body;
        if (!itemId || quantity < 1) {
            console.log("🚨 Invalid request data:", req.body);
            res
                .status(400)
                .json({ error: "Valid item ID and quantity are required" });
            return;
        }
        const cart = yield cartModel_1.default.findOne({ user: userId });
        if (!cart) {
            console.log("🚨 Cart not found for user:", userId);
            res.status(404).json({ error: "Cart not found" });
            return;
        }
        const item = cart.items.find((item) => { var _a; return ((_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) === itemId; });
        if (!item) {
            console.log("🚨 Item not found in cart:", itemId, "Available items:", cart.items);
            res.status(404).json({ error: "Item not found in cart" });
            return;
        }
        item.quantity = quantity;
        yield cart.save();
        console.log("✅ Updated cart item:", item);
        res.status(200).json(cart);
    }
    catch (err) {
        console.error("❌ Failed to update cart item:", err);
        res.status(500).json({ error: "Failed to update cart item" });
    }
});
exports.updateCartItem = updateCartItem;
const getCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token)
        return (0, authController_1.sendError)(res, "Token required", 401);
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
    console.log("🔹 Received request to remove item:", req.body);
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token)
        return (0, authController_1.sendError)(res, "Token required", 401);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;
        const { cakeId } = req.body;
        if (!cakeId) {
            console.log("🚨 Missing cakeId in request");
            res.status(400).json({ error: "Cake ID is required" });
            return;
        }
        const cart = yield cartModel_1.default.findOne({ user: userId });
        if (!cart) {
            console.log("🚨 Cart not found for user:", userId);
            res.status(404).json({ error: "Cart not found" });
            return;
        }
        const initialLength = cart.items.length;
        cart.items = cart.items.filter((item) => item.cake.toString() !== cakeId);
        if (cart.items.length === initialLength) {
            console.log("🚨 Cake ID not found in cart:", cakeId);
            res.status(404).json({ error: "Item not found in cart" });
            return;
        }
        yield cart.save();
        console.log("✅ Removed item from cart:", cakeId);
        res.status(200).json(cart);
    }
    catch (err) {
        console.error("❌ Failed to remove item from cart:", err);
        res.status(500).json({ error: "Failed to remove item from cart" });
    }
});
exports.removeFromCart = removeFromCart;
const clearCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token)
        return (0, authController_1.sendError)(res, "Token required", 401);
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
    updateCartItem: exports.updateCartItem,
    getCart: exports.getCart,
    removeFromCart: exports.removeFromCart,
    clearCart: exports.clearCart,
};
//# sourceMappingURL=cartController.js.map
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDecorations = exports.validateOrderInput = exports.checkDeliveryDate = exports.applyDiscountCode = exports.duplicateOrder = exports.saveDraftOrder = exports.getAllOrders = exports.placeOrder = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
const cakeModel_1 = __importDefault(require("../models/cakeModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const discountCodeModel_1 = __importDefault(require("../models/discountCodeModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const cartModel_1 = __importDefault(require("../models/cartModel"));
const placeOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, items, paymentMethod, decoration } = req.body;
    console.log("📨 Received Order Request:", req.body);
    if (!userId || !items || items.length === 0) {
        res.status(400).json({ error: "User ID and items are required" });
        return;
    }
    try {
        const cakeIds = items.map((i) => i.cakeId);
        const cakes = yield cakeModel_1.default.find({ _id: { $in: cakeIds } });
        if (cakes.length !== items.length) {
            res.status(404).json({ error: "One or more cakes not found" });
            return;
        }
        let totalPrice = 0;
        const mappedItems = items
            .map((i) => {
            const foundCake = cakes.find((c) => c._id.toString() === i.cakeId);
            if (!foundCake)
                return null;
            totalPrice += foundCake.price * i.quantity;
            return { cake: i.cakeId, quantity: i.quantity };
        })
            .filter(Boolean);
        const order = new orderModel_1.default({
            user: userId,
            items: mappedItems,
            totalPrice,
            decoration: decoration || "",
            paymentMethod,
            status: "pending",
        });
        const savedOrder = yield order.save();
        console.log("✅ Order Saved:", savedOrder);
        yield cartModel_1.default.deleteOne({ user: userId });
        res.status(201).json(savedOrder);
    }
    catch (error) {
        console.error("❌ Error placing order:", error);
        res.status(500).json({ error: "Failed to place order" });
    }
});
exports.placeOrder = placeOrder;
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🔍 Fetching all orders...");
        const orders = yield orderModel_1.default.find()
            .populate("user", "nickname email")
            .populate({
            path: "items.cake",
            select: "name price image",
            strictPopulate: false,
        });
        console.log("✅ Orders retrieved:", JSON.stringify(orders, null, 2));
        res.status(200).json(orders);
    }
    catch (err) {
        console.error("❌ Error fetching orders:", err);
        res.status(500).json({
            error: "Failed to fetch orders",
            details: err.message,
        });
    }
});
exports.getAllOrders = getAllOrders;
const saveDraftOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { userId, cakeId, quantity } = req.body;
    if (!userId || !cakeId || !quantity) {
        res
            .status(400)
            .json({ error: "User ID, Cake ID, and quantity are required" });
        return;
    }
    try {
        const order = new orderModel_1.default({
            user: userId,
            cake: cakeId,
            quantity,
            status: "draft",
            imagePath: ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) || null,
        });
        const savedOrder = yield order.save();
        res.status(201).json(savedOrder);
    }
    catch (err) {
        console.error("Error saving draft order:", err);
        res.status(500).json({ error: "Failed to save draft order" });
    }
});
exports.saveDraftOrder = saveDraftOrder;
const duplicateOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.body;
    try {
        const originalOrder = yield orderModel_1.default.findById(orderId);
        if (!originalOrder) {
            res.status(404).json({ error: "Original order not found" });
            return;
        }
        const _a = originalOrder.toObject(), { _id, createdAt, updatedAt } = _a, orderData = __rest(_a, ["_id", "createdAt", "updatedAt"]);
        const duplicatedOrder = new orderModel_1.default(Object.assign(Object.assign({}, orderData), { createdAt: new Date(), updatedAt: new Date() }));
        const savedOrder = yield duplicatedOrder.save();
        res.status(201).json(savedOrder);
    }
    catch (err) {
        console.error("Error duplicating order:", err);
        res.status(500).json({ error: "Failed to duplicate order" });
    }
});
exports.duplicateOrder = duplicateOrder;
const applyDiscountCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, discountCode } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
        res.status(400).json({ error: "Invalid order ID format" });
        return;
    }
    try {
        const validCode = yield discountCodeModel_1.default.findOne({
            code: discountCode,
            isActive: true,
        });
        if (!validCode) {
            res.status(400).json({ error: "Invalid or expired discount code" });
            return;
        }
        const order = yield orderModel_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        order.totalPrice *= 1 - validCode.discountPercentage / 100;
        yield order.save();
        res.status(200).json(order);
    }
    catch (err) {
        console.error("Failed to apply discount code:", err);
        res.status(500).json({ error: "Failed to apply discount code" });
    }
});
exports.applyDiscountCode = applyDiscountCode;
const checkDeliveryDate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date } = req.body;
    if (!date) {
        res.status(400).json({ error: "Date is required" });
        return;
    }
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const ordersOnDate = yield orderModel_1.default.countDocuments({
            deliveryDate: { $gte: startOfDay, $lte: endOfDay },
        });
        const maxOrdersPerDay = 10;
        res.status(200).json({ available: ordersOnDate < maxOrdersPerDay });
    }
    catch (err) {
        console.error("Failed to check delivery date:", err);
        res.status(500).json({ error: "Failed to check delivery date" });
    }
});
exports.checkDeliveryDate = checkDeliveryDate;
const validateOrderInput = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, cakeId, quantity } = req.body;
    if (!userId || !cakeId || !quantity) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    if (quantity <= 0) {
        res.status(400).json({ error: "Quantity must be greater than zero" });
        return;
    }
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId) ||
            !mongoose_1.default.Types.ObjectId.isValid(cakeId)) {
            res.status(400).json({ error: "Invalid ID format" });
            return;
        }
        const userExists = yield userModel_1.default.exists({ _id: userId });
        const cakeExists = yield cakeModel_1.default.exists({ _id: cakeId });
        if (!userExists) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        if (!cakeExists) {
            res.status(404).json({ error: "Cake not found" });
            return;
        }
        res.status(200).json({ valid: true });
    }
    catch (err) {
        console.error("Validation error:", err);
        res.status(500).json({ error: "Failed to validate order" });
    }
});
exports.validateOrderInput = validateOrderInput;
const getDecorations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const decorations = [
            "Sprinkles",
            "Chocolates",
            "Fondant",
            "Fruit Slices",
            "Icing Roses",
        ];
        res.status(200).json(decorations);
    }
    catch (error) {
        console.error("Error fetching decorations:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.getDecorations = getDecorations;
exports.default = {
    placeOrder: exports.placeOrder,
    getAllOrders: exports.getAllOrders,
    saveDraftOrder: exports.saveDraftOrder,
    duplicateOrder: exports.duplicateOrder,
    applyDiscountCode: exports.applyDiscountCode,
    checkDeliveryDate: exports.checkDeliveryDate,
    validateOrderInput: exports.validateOrderInput,
    getDecorations: exports.getDecorations,
};
//# sourceMappingURL=ordersController.js.map
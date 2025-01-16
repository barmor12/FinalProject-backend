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
exports.getAllOrders = exports.placeOrder = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
const cakeModel_1 = __importDefault(require("../models/cakeModel"));
const placeOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, cakeId, quantity } = req.body;
    if (!userId || !cakeId || !quantity) {
        res.status(400).json({ error: "User ID, Cake ID, and quantity are required" });
        return;
    }
    try {
        const cake = yield cakeModel_1.default.findById(cakeId);
        if (!cake) {
            res.status(404).json({ error: "Cake not found" });
            return;
        }
        const totalPrice = cake.price * quantity;
        const order = new orderModel_1.default({
            user: userId,
            cake: cakeId,
            quantity,
            totalPrice,
        });
        const savedOrder = yield order.save();
        res.status(201).json(savedOrder);
    }
    catch (err) {
        console.error('Failed to place order:', err);
        res.status(500).json({ error: 'Failed to place order' });
    }
});
exports.placeOrder = placeOrder;
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield orderModel_1.default.find()
            .populate("user", "nickname email")
            .populate("cake", "name price");
        res.status(200).json(orders);
    }
    catch (err) {
        console.error('Failed to fetch orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
exports.getAllOrders = getAllOrders;
//# sourceMappingURL=ordersController.js.map
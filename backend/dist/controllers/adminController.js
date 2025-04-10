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
exports.getUserById = exports.getAllUsers = exports.updateUser = exports.updateOrder = exports.getStats = exports.getAllOrders = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield orderModel_1.default.find();
        res.status(200).json({ orders });
    }
    catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});
exports.getAllOrders = getAllOrders;
const getStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const [ordersCount, usersCount, revenueAgg] = yield Promise.all([
            orderModel_1.default.countDocuments(),
            userModel_1.default.countDocuments(),
            orderModel_1.default.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$totalPrice" }
                    }
                }
            ])
        ]);
        const totalRevenue = ((_a = revenueAgg[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0;
        res.status(200).json({
            ordersCount,
            usersCount,
            totalRevenue,
        });
    }
    catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
});
exports.getStats = getStats;
const updateOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        const updateData = req.body;
        const order = yield orderModel_1.default.findByIdAndUpdate(orderId, updateData, { new: true });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
        }
        res.status(200).json({ order });
    }
    catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ error: "Failed to update order" });
    }
});
exports.updateOrder = updateOrder;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const updateData = req.body;
        const user = yield userModel_1.default.findByIdAndUpdate(userId, updateData, { new: true });
        if (!user) {
            res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ user });
    }
    catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});
exports.updateUser = updateUser;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield userModel_1.default.find();
        if (!users || users.length === 0) {
            res.status(404).json({ message: "No users found" });
            return;
        }
        res.status(200).json(users);
    }
    catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});
exports.getAllUsers = getAllUsers;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const user = yield userModel_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});
exports.getUserById = getUserById;
//# sourceMappingURL=adminController.js.map
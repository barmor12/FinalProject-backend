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
exports.getStatistics = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const logger_1 = __importDefault(require("../logger"));
const getStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const [totalOrders, totalUsers] = yield Promise.all([
            orderModel_1.default.countDocuments(),
            userModel_1.default.countDocuments(),
        ]);
        const deliveredOrders = yield orderModel_1.default.find({ status: "delivered" }).populate({
            path: "items.cake",
            select: "name cost price",
        });
        const allOrdersPriceAgg = yield orderModel_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: { $ifNull: ["$totalPrice", 0] } },
                },
            },
        ]);
        const totalOrdersPrice = ((_a = allOrdersPriceAgg[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        let totalRevenue = 0;
        let totalCost = 0;
        let totalProfit = 0;
        const ordersWithRevenue = deliveredOrders.map((order) => {
            let orderCost = 0;
            const orderRevenue = order.totalRevenue || 0;
            order.items.forEach((item) => {
                const cake = item.cake;
                const quantity = item.quantity || 0;
                const costPerUnit = (cake === null || cake === void 0 ? void 0 : cake.cost) || 0;
                const itemCost = quantity * costPerUnit;
                orderCost += itemCost;
            });
            const orderProfit = orderRevenue - orderCost;
            totalRevenue += orderRevenue;
            totalCost += orderCost;
            totalProfit += orderProfit;
            return {
                _id: order._id,
                createdAt: order.createdAt,
                totalPrice: order.totalPrice || 0,
                status: order.status,
                orderRevenue,
                orderCost,
                orderProfit,
            };
        });
        const monthlyData = yield orderModel_1.default.aggregate([
            {
                $match: {
                    status: "delivered",
                    createdAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: { $ifNull: ["$totalRevenue", 0] } },
                    totalPrice: { $sum: { $ifNull: ["$totalPrice", 0] } },
                },
            },
            {
                $project: {
                    _id: 0,
                    month: {
                        $let: {
                            vars: {
                                monthsInString: [
                                    "",
                                    "Jan",
                                    "Feb",
                                    "Mar",
                                    "Apr",
                                    "May",
                                    "Jun",
                                    "Jul",
                                    "Aug",
                                    "Sep",
                                    "Oct",
                                    "Nov",
                                    "Dec",
                                ],
                            },
                            in: {
                                $concat: [
                                    { $arrayElemAt: ["$$monthsInString", "$_id.month"] },
                                    " ",
                                    { $toString: "$_id.year" },
                                ],
                            },
                        },
                    },
                    count: 1,
                    revenue: 1,
                    totalPrice: 1,
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);
        const orderStatusData = yield orderModel_1.default.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    status: "$_id",
                    count: 1,
                },
            },
        ]);
        const statusTypes = ["delivered", "pending", "cancelled"];
        const formattedOrderStatusData = statusTypes.map((status) => {
            const match = orderStatusData.find((item) => item.status === status);
            return {
                status,
                count: (match === null || match === void 0 ? void 0 : match.count) || 0,
            };
        });
        const cakeStats = deliveredOrders.reduce((acc, order) => {
            order.items.forEach((item) => {
                var _a, _b;
                const cake = item.cake;
                const quantity = item.quantity || 0;
                const pricePerUnit = (_b = (_a = item.price) !== null && _a !== void 0 ? _a : cake === null || cake === void 0 ? void 0 : cake.price) !== null && _b !== void 0 ? _b : 0;
                const costPerUnit = (cake === null || cake === void 0 ? void 0 : cake.cost) || 0;
                if (!cake || !cake._id || !cake.name)
                    return;
                const cakeId = cake._id.toString();
                if (!acc[cakeId]) {
                    acc[cakeId] = {
                        name: cake.name,
                        quantity: 0,
                        revenue: 0,
                        cost: 0,
                        profit: 0,
                    };
                }
                const itemRevenue = quantity * pricePerUnit;
                const itemCost = quantity * costPerUnit;
                const itemProfit = itemRevenue - itemCost;
                acc[cakeId].quantity += quantity;
                acc[cakeId].revenue += itemRevenue;
                acc[cakeId].cost += itemCost;
                acc[cakeId].profit += itemProfit;
            });
            return acc;
        }, {});
        const topProfitableCakes = Object.values(cakeStats)
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 5);
        logger_1.default.info("[INFO] Statistics retrieved successfully");
        res.status(200).json({
            totalOrders,
            totalUsers,
            totalOrdersPrice,
            orderStatusData: formattedOrderStatusData,
            totalRevenue,
            totalCost,
            totalProfit,
            monthlyData,
            topProfitableCakes,
            ordersWithRevenue,
        });
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Error retrieving statistics: ${error}`);
        res.status(500).json({ error: "Failed to retrieve statistics" });
    }
});
exports.getStatistics = getStatistics;
exports.default = {
    getStatistics: exports.getStatistics,
};
//# sourceMappingURL=statisticsController.js.map
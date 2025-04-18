import { Request, Response } from "express";
import Order from "../models/orderModel";
import User from "../models/userModel";
import logger from "../logger";

export const getStatistics = async (req: Request, res: Response) => {
    try {
        const [totalOrders, totalUsers] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments(),
        ]);

        const deliveredOrders = await Order.find({ status: "delivered" }).populate({
            path: "items.cake",
            select: "name cost price",
        });

        // חישוב כולל של סכום מחירי ההזמנות
        const allOrdersPriceAgg = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: { $ifNull: ["$totalPrice", 0] } },
                },
            },
        ]);
        const totalOrdersPrice = allOrdersPriceAgg[0]?.total || 0;

        let totalRevenue = 0;
        let totalCost = 0;
        let totalProfit = 0;

        const ordersWithRevenue = deliveredOrders.map((order) => {
            let orderCost = 0;
            const orderRevenue = order.totalRevenue || 0;

            order.items.forEach((item) => {
                const cake = item.cake as any;
                const quantity = item.quantity || 0;
                const costPerUnit = cake?.cost || 0;

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

        // חישוב סטטיסטיקת חודשים
        const monthlyData = await Order.aggregate([
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

        // סטטוסי הזמנות
        const orderStatusData = await Order.aggregate([
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
                count: match?.count || 0,
            };
        });

        // עוגות הכי רווחיות
        const cakeStats = deliveredOrders.reduce((acc: any, order) => {
            order.items.forEach((item) => {
                const cake = item.cake as any;
                const quantity = item.quantity || 0;
                const pricePerUnit = item.price ?? cake?.price ?? 0;
                const costPerUnit = cake?.cost || 0;

                if (!cake || !cake._id || !cake.name) return;

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
            .sort((a: any, b: any) => b.profit - a.profit)
            .slice(0, 5);

        logger.info("[INFO] Statistics retrieved successfully");

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
    } catch (error) {
        logger.error(`[ERROR] Error retrieving statistics: ${error}`);
        res.status(500).json({ error: "Failed to retrieve statistics" });
    }
};

export default {
    getStatistics,
};

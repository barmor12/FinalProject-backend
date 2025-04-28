import { Request, Response } from "express";
import Order from "../models/orderModel";
import User from "../models/userModel";
import logger from "../logger";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Expense from "../models/expenseModel";

// Expense interface for TypeScript
interface ExpenseType {
    _id: string;
    description: string;
    amount: number;
    category: string;
    date: Date;
}

dotenv.config();

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

export const generateFinancialReport = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: "No token provided" });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: string, role: string };
        const user = await User.findById(decoded.userId);
        if (!user || user.role !== "admin") {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }

        try {
            const orders = await Order.find().populate({
                path: "items.cake",
                select: "name price cost"
            });

            // Ensure the expenses model exists and has data
            let expenses: ExpenseType[] = [];
            try {
                expenses = await Expense.find();
                logger.info(`[INFO] Found ${expenses.length} expense records`);
            } catch (expError: any) {
                logger.error(`[ERROR] Error fetching expenses: ${expError.message}`);
                // Proceed with empty expenses if there's an error
                expenses = [];
            }

            const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
            const totalOrders = orders.length;
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            const totalCostOfGoodsSold = orders.reduce((sum, order) => {
                return sum + order.items.reduce((itemSum, item) => {
                    const cake = item.cake as any;
                    if (!cake) return itemSum;

                    const cost = cake.cost || 0;
                    const quantity = item.quantity || 0;
                    return itemSum + (cost * quantity);
                }, 0);
            }, 0);

            const grossProfit = totalRevenue - totalCostOfGoodsSold;
            const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const netProfit = grossProfit - totalExpenses;

            // הכנסות לפי חודשים
            const monthlyRevenue = orders.reduce((acc: { [key: string]: number }, order) => {
                const date = new Date(order.createdAt);
                const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                acc[month] = (acc[month] || 0) + order.totalPrice;
                return acc;
            }, {});

            // רווחים חודשיים
            const monthlyProfit: { [key: string]: number } = {};
            Object.keys(monthlyRevenue).forEach(month => {
                const monthExpenses = expenses
                    .filter(exp => {
                        const date = new Date(exp.date);
                        const m = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        return m === month;
                    })
                    .reduce((sum, exp) => sum + exp.amount, 0);
                monthlyProfit[month] = monthlyRevenue[month] - monthExpenses;
            });

            // עוגות הכי נמכרות
            const cakeSales: { [cakeName: string]: number } = {};
            orders.forEach(order => {
                if (!order.items || !Array.isArray(order.items)) return;

                order.items.forEach(item => {
                    const cake = item.cake as any;
                    if (!cake) return;

                    const cakeName = cake.name || 'Unknown Cake';
                    const quantity = item.quantity || 0;

                    if (quantity > 0) {
                        cakeSales[cakeName] = (cakeSales[cakeName] || 0) + quantity;
                    }
                });
            });

            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const pdfPath = path.join(tempDir, `financial-report-${Date.now()}.pdf`);
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(pdfPath);
            doc.pipe(stream);

            // HEADER
            doc.fontSize(25).text('Financial Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Business Name: My Cake Shop`, { align: 'left' });
            doc.text(`Tax ID: 123456789`, { align: 'left' }); // תחליף לח.פ. האמיתי
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-US')}`, { align: 'left' });
            doc.moveDown();

            // SUMMARY
            doc.fontSize(16).text('Summary', { underline: true });
            doc.moveDown();
            doc.fontSize(12).text(`Total Revenue: $${totalRevenue.toFixed(2)}`);
            doc.text(`Total Orders: ${totalOrders}`);
            doc.text(`Average Order Value: $${averageOrderValue.toFixed(2)}`);
            doc.text(`Total Cost of Goods Sold: $${totalCostOfGoodsSold.toFixed(2)}`);
            doc.text(`Gross Profit: $${grossProfit.toFixed(2)}`);
            doc.text(`Other Expenses: $${totalExpenses.toFixed(2)}`);
            doc.text(`Net Profit: $${netProfit.toFixed(2)}`);
            doc.moveDown();

            // Monthly Revenue
            doc.fontSize(16).text('Monthly Revenue & Profit', { underline: true });
            doc.moveDown();

            const tableLeft = 50;
            const colWidth = 200;
            let y = doc.y;
            doc.fontSize(12)
                .text('Month', tableLeft, y)
                .text('Revenue', tableLeft + colWidth, y)
                .text('Net Profit', tableLeft + colWidth * 2, y);

            y += 20;
            Object.entries(monthlyRevenue).forEach(([month, revenue]) => {
                doc.text(month, tableLeft, y)
                    .text(`$${revenue.toFixed(2)}`, tableLeft + colWidth, y)
                    .text(`$${(monthlyProfit[month] || 0).toFixed(2)}`, tableLeft + colWidth * 2, y);
                y += 20;
            });

            doc.addPage();

            // Expenses Breakdown
            doc.fontSize(16).text('Expenses Breakdown', { underline: true });
            doc.moveDown();

            y = doc.y;
            doc.fontSize(12)
                .text('Description', tableLeft, y)
                .text('Category', tableLeft + 150, y)
                .text('Amount', tableLeft + 300, y)
                .text('Date', tableLeft + 400, y);

            y += 20;
            expenses.forEach(expense => {
                doc.text(expense.description, tableLeft, y)
                    .text(expense.category, tableLeft + 150, y)
                    .text(`$${expense.amount.toFixed(2)}`, tableLeft + 300, y)
                    .text(new Date(expense.date).toLocaleDateString('en-US'), tableLeft + 400, y);
                y += 20;
            });

            doc.addPage();

            // Top Selling Cakes
            doc.fontSize(16).text('Top Selling Cakes', { underline: true });
            doc.moveDown();

            y = doc.y;
            doc.fontSize(12)
                .text('Cake', tableLeft, y)
                .text('Quantity Sold', tableLeft + 200, y);

            y += 20;
            Object.entries(cakeSales).sort((a, b) => b[1] - a[1]).forEach(([cakeName, qty]) => {
                doc.text(cakeName, tableLeft, y)
                    .text(qty.toString(), tableLeft + 200, y);
                y += 20;
            });

            // Declaration
            doc.moveDown(4);
            doc.fontSize(10)
                .text('Declaration: The information presented in this report is accurate to the best of our knowledge.', 50, doc.page.height - 80);

            doc.end();

            await new Promise((resolve, reject) => {
                stream.on('finish', resolve);
                stream.on('error', reject);
            });

            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
                secure: true,
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Financial Report",
                text: "Please find attached your detailed financial report.",
                attachments: [{ filename: 'financial-report.pdf', path: pdfPath }]
            });

            fs.unlinkSync(pdfPath);

            logger.info(`[INFO] Financial report sent to ${user.email}`);
            res.status(200).json({ message: "Financial report has been sent to your email" });

        } catch (error: any) {
            logger.error(`[ERROR] Failed to generate financial report: ${error.message}`);
            res.status(500).json({ message: "Failed to generate financial report" });
        }
    } catch (error: any) {
        logger.error(`[ERROR] Failed to generate financial report: ${error.message}`);
        res.status(500).json({ message: "Failed to generate financial report" });
    }
};


export default {
    getStatistics,
    generateFinancialReport,
};

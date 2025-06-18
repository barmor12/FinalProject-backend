import { Request, Response } from 'express';
import Order from '../models/orderModel';
import User from '../models/userModel';
import logger from '../logger';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config();

export const getStatistics = async (req: Request, res: Response) => {
    try {
        const [totalOrders, totalUsers] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments(),
        ]);

        const deliveredOrders = await Order.find({ status: 'delivered' }).populate({
            path: 'items.cake',
            select: 'name cost price',
        });

        // חישוב כולל של סכום מחירי ההזמנות
        const allOrdersPriceAgg = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: { $ifNull: ['$totalPrice', 0] } },
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
                    status: 'delivered',
                    createdAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' },
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: { $ifNull: ['$totalRevenue', 0] } },
                    totalPrice: { $sum: { $ifNull: ['$totalPrice', 0] } },
                },
            },
            {
                $project: {
                    _id: 0,
                    month: {
                        $let: {
                            vars: {
                                monthsInString: [
                                    '',
                                    'Jan',
                                    'Feb',
                                    'Mar',
                                    'Apr',
                                    'May',
                                    'Jun',
                                    'Jul',
                                    'Aug',
                                    'Sep',
                                    'Oct',
                                    'Nov',
                                    'Dec',
                                ],
                            },
                            in: {
                                $concat: [
                                    { $arrayElemAt: ['$$monthsInString', '$_id.month'] },
                                    ' ',
                                    { $toString: '$_id.year' },
                                ],
                            },
                        },
                    },
                    count: 1,
                    revenue: 1,
                    totalPrice: 1,
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // סטטוסי הזמנות
        const orderStatusData = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    status: '$_id',
                    count: 1,
                },
            },
        ]);

        const statusTypes = ['delivered', 'pending', 'cancelled'];
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

        logger.info('[INFO] Statistics retrieved successfully');

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
        res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
};

export const generateFinancialReport = async (req: Request, res: Response) => {
    try {
        // Get token from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
            userId: string;
            role: string;
        };

        // Find user by ID
        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            res
                .status(403)
                .json({ message: 'Only admins can generate financial reports' });
            return;
        }

        // Get all orders
        const orders = await Order.find().populate({
            path: 'items.cake',
            select: 'name price cost',
        });

        // Calculate total revenue
        const totalRevenue = orders.reduce(
            (sum, order) => sum + order.totalPrice,
            0
        );

        // Calculate total orders
        const totalOrders = orders.length;

        // Calculate average order value
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Get monthly revenue (object: { [monthYear]: revenue })
        const monthlyRevenue: { [key: string]: number } = {};
        orders.forEach((order) => {
            const date = new Date(order.createdAt);
            const month = date.toLocaleString('en-US', { month: 'short' });
            const year = date.getFullYear();
            const label = `${month} ${year}`;
            monthlyRevenue[label] = (monthlyRevenue[label] || 0) + order.totalPrice;
        });

        // Get order status data (object: { [status]: count })
        const orderStatusDataRaw = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);
        const orderStatusData: { [key: string]: number } = {};
        orderStatusDataRaw.forEach((item: any) => {
            orderStatusData[item._id] = item.count;
        });

        // Extract top cake name for the report
        let topCakeName = 'N/A';
        const cakeCount: { [cakeName: string]: number } = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const cake = item.cake as any;
                if (!cake || !cake.name) return;
                cakeCount[cake.name] = (cakeCount[cake.name] || 0) + (item.quantity || 0);
            });
        });
        const topCake = Object.entries(cakeCount).sort((a, b) => b[1] - a[1])[0];
        if (topCake) {
            topCakeName = topCake[0];
        }

        // Prepare chart image (bar chart for order status)
        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
            type: 'bar',
            data: {
                labels: Object.keys(orderStatusData),
                datasets: [{
                    label: 'Order Status Count',
                    data: Object.values(orderStatusData),
                    backgroundColor: [
                        '#A0522D', // brown
                        '#CD853F', // peru
                        '#D2691E', // chocolate
                    ],
                }],
            },
            options: {
                plugins: {
                    legend: { display: false }
                }
            }
        }))}`;
        const chartImage = await fetch(chartUrl).then((res) => res.buffer());
        // Save chart image to temp file for PDFKit image insertion
        const tempChartPath = path.join(__dirname, '../temp/chart.png');
        if (!fs.existsSync(path.dirname(tempChartPath))) {
            fs.mkdirSync(path.dirname(tempChartPath), { recursive: true });
        }
        fs.writeFileSync(tempChartPath, chartImage);

        // Create PDF with modern/professional style
        const PDFKit = require('pdfkit');
        const pdfPath = path.join(
            __dirname,
            `../temp/financial-report-${Date.now()}.pdf`
        );
        const stream = fs.createWriteStream(pdfPath);
        const doc = new PDFKit({ size: 'A4' });
        doc.pipe(stream);

        // Set Helvetica font and brown/dark orange color theme
        doc.font('Helvetica-Bold');
        doc.fontSize(22);
        doc.fillColor('#8B4513');
        doc.text('Financial Report', 0, 50, { align: 'center' });

        // Section: Top Selling Cake
        doc.moveDown(2);
        doc.fontSize(14);
        doc.fillColor('#333333');
        doc.text('Top Selling Cake:', 50, doc.y);
        doc.font('Helvetica');
        doc.fontSize(14);
        doc.text(`${topCakeName}`, 200, doc.y - 16);

        // Section Header with colored underline
        doc.moveDown(2);
        doc.font('Helvetica-Bold');
        doc.fontSize(16);
        doc.fillColor('#8B4513');
        doc.text('Revenue Summary:', 50, doc.y);
        // Colored underline
        const summaryY = doc.y;
        doc.moveTo(50, summaryY + 5)
            .lineTo(200, summaryY + 5)
            .lineWidth(2)
            .strokeColor('#8B4513')
            .stroke();
        doc.moveDown();

        // Revenue details
        doc.font('Helvetica');
        doc.fontSize(13);
        doc.fillColor('#333333');
        doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 60, doc.y + 10);
        doc.text(`Total Orders: ${totalOrders}`, 60, doc.y + 5);
        doc.text(`Average Order Value: $${averageOrderValue.toFixed(2)}`, 60, doc.y + 5);
        doc.moveDown(2);

        // Insert chart image if it exists
        if (fs.existsSync(tempChartPath)) {
            const chartImageBuffer = fs.readFileSync(tempChartPath);
            doc.image(chartImageBuffer, 50, doc.y + 10, {
                fit: [500, 300],
                align: 'center',
                valign: 'center',
            });
            doc.moveDown(16);
        }

        // Section: Monthly Revenue
        doc.addPage();
        doc.font('Helvetica-Bold');
        doc.fontSize(16);
        doc.fillColor('#8B4513');
        doc.text('Monthly Revenue Breakdown', 50, 50);
        doc.moveTo(50, 72)
            .lineTo(300, 72)
            .lineWidth(2)
            .strokeColor('#8B4513')
            .stroke();
        doc.moveDown(2);
        // Table header
        doc.fontSize(13).fillColor('#333333').font('Helvetica-Bold');
        doc.text('Month', 60, doc.y);
        doc.text('Revenue', 200, doc.y - 16);
        doc.font('Helvetica');
        Object.entries(monthlyRevenue).forEach(([month, revenue]) => {
            doc.fontSize(12).fillColor('#333333');
            doc.text(month, 60, doc.y);
            doc.text(`$${revenue.toFixed(2)}`, 200, doc.y - 16);
        });
        doc.moveDown(2);

        // Section: Top Profitable Cakes
        // Extract top profitable cakes from orders
        const cakeStats = orders.reduce((acc: any, order) => {
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
        doc.addPage();
        doc.font('Helvetica-Bold');
        doc.fontSize(16);
        doc.fillColor('#8B4513');
        doc.text('Top Profitable Cakes', 50, 50);
        doc.moveTo(50, 72)
            .lineTo(300, 72)
            .lineWidth(2)
            .strokeColor('#8B4513')
            .stroke();
        doc.moveDown(2);
        topProfitableCakes.forEach((cake: any, index: number) => {
            doc.font('Helvetica-Bold').fontSize(13).fillColor('#333333');
            doc.text(`${index + 1}. ${cake.name}`, 60, doc.y);
            doc.font('Helvetica').fontSize(12).fillColor('#333333');
            doc.text(`   Quantity Sold: ${cake.quantity}`, 70, doc.y);
            doc.text(`   Total Revenue: $${cake.revenue.toFixed(2)}`, 70, doc.y);
            doc.text(`   Total Profit: $${cake.profit.toFixed(2)}`, 70, doc.y);
            doc.moveDown();
        });
        doc.moveDown(2);

        // Footer
        doc.font('Helvetica').fontSize(10).fillColor('#7f8c8d');
        doc.text('Thank you for using BAKEY!', 0, doc.page.height - 60, { align: 'center' });

        // Finalize PDF
        doc.end();

        // Wait for the PDF to be written
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        // Create email transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Send email with PDF attachment
        await transporter.sendMail({
            from: `"Bakey" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Financial Report',
            text: 'Please find attached your financial report.',
            attachments: [
                {
                    filename: 'financial-report.pdf',
                    path: pdfPath,
                },
            ],
        });

        // Clean up the temporary PDF file and chart
        fs.unlinkSync(pdfPath);
        if (fs.existsSync(tempChartPath)) {
            fs.unlinkSync(tempChartPath);
        }

        logger.info(`[INFO] Financial report sent to ${user.email}`);

        res
            .status(200)
            .json({ message: 'Financial report has been sent to your email' });
    } catch (error: any) {
        logger.error(
            `[ERROR] Failed to generate financial report: ${error.message}`
        );
        res.status(500).json({ message: 'Failed to generate financial report' });
    }
};

export const getTopCakeName = async (req: Request, res: Response) => {
    try {
      const deliveredOrders = await Order.find({
        status: { $in: ['delivered', 'confirmed'] }
      }).populate({
        path: 'items.cake',
        select: 'name',
      });

      const cakeCount: { [cakeName: string]: number } = {};

      deliveredOrders.forEach(order => {
        order.items.forEach(item => {
          const cake = item.cake as any;
          if (!cake || !cake.name) return;
          cakeCount[cake.name] = (cakeCount[cake.name] || 0) + (item.quantity || 0);
        });
      });

      const topCake = Object.entries(cakeCount).sort((a, b) => b[1] - a[1])[0];

      res.status(200).json({ name: topCake ? topCake[0] : 'N/A' });
    } catch (error) {
      logger.error(`[ERROR] Failed to get top cake: ${error}`);
      res.status(500).json({ name: 'N/A' });
    }
  };

export default {
    getStatistics,
    generateFinancialReport,
    getTopCakeName,
};

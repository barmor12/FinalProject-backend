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
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
      userId: string;
      role: string;
    };

    // Find user by ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Check if user is admin
    if (user.role !== "admin") {
      res
        .status(403)
        .json({ message: "Only admins can generate financial reports" });
      return;
    }

    // Get all orders
    const orders = await Order.find().populate({
      path: "items.cake",
      select: "name price cost",
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

    // Get monthly revenue
    const monthlyRevenue = orders.reduce(
      (acc: { [key: string]: number }, order) => {
        const date = new Date(order.createdAt);
        const month = date.toLocaleString("en-US", { month: "long" });
        acc[month] = (acc[month] || 0) + order.totalPrice;
        return acc;
      },
      {}
    );

    // Create PDF
    const doc = new PDFDocument();
    const pdfPath = path.join(
      __dirname,
      `../temp/financial-report-${Date.now()}.pdf`
    );

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create write stream
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // אם יש לוגו:
    // const logoPath = path.join(__dirname, "../assets/logo.png");
    // if (fs.existsSync(logoPath)) {
    //     doc.image(logoPath, { width: 80, align: "left" });
    // }

    doc
      .fillColor("#2c3e50")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("BAKEY Financial Report", { align: "center" })
      .moveDown(0.5);

    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .stroke()
      .moveDown();

    // Add date
    doc
      .fontSize(12)
      .fillColor("black")
      .text(`Generated on: ${new Date().toLocaleDateString("en-US")}`, {
        align: "right",
      });
    doc.moveDown();

    doc
      .fontSize(16)
      .fillColor("#34495e")
      .text("Summary", { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .fillColor("black")
      .text(`• Total Revenue: $${totalRevenue.toFixed(2)}`)
      .text(`• Total Orders: ${totalOrders}`)
      .text(`• Average Order Value: $${averageOrderValue.toFixed(2)}`)
      .moveDown();

    doc
      .fontSize(16)
      .fillColor("#34495e")
      .text("Monthly Revenue Breakdown", { underline: true })
      .moveDown(0.5);

    // Create table for monthly data
    const tableLeft = 50;
    const colWidth = 150;

    // Table headers
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#2c3e50")
      .text("Month", tableLeft, doc.y)
      .text("Revenue", tableLeft + colWidth, doc.y);
    doc.moveDown();

    doc.font("Helvetica").fillColor("black");
    Object.entries(monthlyRevenue).forEach(([month, revenue]) => {
      doc
        .text(month, tableLeft, doc.y)
        .text(`$${revenue.toFixed(2)}`, tableLeft + colWidth, doc.y);
      doc.moveDown();
    });

    // Add top profitable cakes
    doc
      .addPage()
      .fontSize(16)
      .fillColor("#34495e")
      .text("Top Profitable Cakes", { underline: true })
      .moveDown(0.5);

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

    topProfitableCakes.forEach((cake: any, index: number) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#2c3e50")
        .text(`${index + 1}. ${cake.name}`)
        .font("Helvetica")
        .fontSize(11)
        .fillColor("black")
        .text(`   Quantity Sold: ${cake.quantity}`)
        .text(`   Total Revenue: $${cake.revenue.toFixed(2)}`)
        .text(`   Total Profit: $${cake.profit.toFixed(2)}`)
        .moveDown();
    });

    doc
      .moveDown(2)
      .fontSize(10)
      .fillColor("#7f8c8d")
      .text("Thank you for using BAKEY!", { align: "center" });

    // Finalize PDF
    doc.end();

    // Wait for the PDF to be written
    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      secure: true,
    });

    // Send email with PDF attachment
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Financial Report",
      text: "Please find attached your financial report.",
      attachments: [
        {
          filename: "financial-report.pdf",
          path: pdfPath,
        },
      ],
    });

    // Clean up the temporary PDF file
    fs.unlinkSync(pdfPath);

    logger.info(`[INFO] Financial report sent to ${user.email}`);

    res
      .status(200)
      .json({ message: "Financial report has been sent to your email" });
  } catch (error: any) {
    logger.error(
      `[ERROR] Failed to generate financial report: ${error.message}`
    );
    res.status(500).json({ message: "Failed to generate financial report" });
  }
};

export default {
  getStatistics,
  generateFinancialReport,
};

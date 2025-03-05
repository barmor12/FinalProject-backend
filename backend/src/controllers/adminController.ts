import { Request, Response } from "express";
import Order from "../models/orderModel";
import User from "../models/userModel";

// פונקציה למשיכת כל ההזמנות
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find();
        res.status(200).json({ orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};
export const getStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // הרצת השאילתות במקביל לשיפור הביצועים
        const [ordersCount, usersCount, revenueAgg] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments(),
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$totalPrice" }
                    }
                }
            ])
        ]);

        const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

        res.status(200).json({
            ordersCount,
            usersCount,
            totalRevenue,
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
};
// פונקציה לעדכון הזמנה על פי המזהה
export const updateOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const updateData = req.body;

        const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
        }
        res.status(200).json({ order });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ error: "Failed to update order" });
    }
};

// פונקציה למשיכת כל המשתמשים
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find();
        res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

// פונקציה לעדכון משתמש על פי המזהה
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
        if (!user) {
            res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
};


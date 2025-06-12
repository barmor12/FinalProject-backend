import { Request, Response } from 'express';
import Order from '../models/orderModel';
import User from '../models/userModel';
import bcrypt from 'bcryptjs';

// פונקציה למשיכת כל ההזמנות
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find();
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
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
                        totalRevenue: { $sum: '$totalPrice' }
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
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};
// פונקציה לעדכון הזמנה על פי המזהה
export const updateOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const updateData = req.body;

        const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
        }
        res.status(200).json({ order });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
};


// פונקציה לעדכון משתמש על פי המזהה
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Check if password is being updated
        if (updateData.password) {
            console.log('Password update requested');

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(updateData.password, salt);
            updateData.password = hashedPassword;
        }

        // Find the user and update with new data
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Return the updated user (without password)
        const userResponse = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            // Include other fields as needed, but omit password
        };

        res.status(200).json({ user: userResponse });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// פונקציה לשליפת כל המשתמשים
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        // שליפת כל המשתמשים ממסד הנתונים
        const users = await User.find(); // אם צריך ניתן להוסיף פילטרים כמו .select() או .populate() אם יש צורך במידע נוסף

        // אם לא נמצאו משתמשים, נחזיר תשובה ריקה
        if (!users || users.length === 0) {
            res.status(404).json({ message: 'No users found' });
            return;
        }

        // החזרת כל המשתמשים
        res.status(200).json(users);
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// פונקציה לשליפת משתמש לפי מזהה (עבור אדמין)
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

// Toggle order priority status
export const toggleOrderPriority = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { isPriority } = req.body;

        if (isPriority === undefined) {
            res.status(400).json({ error: 'isPriority field is required' });
            return;
        }

        // Find and update the order
        const order = await Order.findByIdAndUpdate(
            orderId,
            { isPriority },
            { new: true }
        );

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Return the updated order
        res.status(200).json({
            message: `Order priority ${isPriority ? 'set' : 'removed'} successfully`,
            order
        });
    } catch (error) {
        console.error('Error updating order priority:', error);
        res.status(500).json({ error: 'Failed to update order priority' });
    }
};

export default {
    getAllOrders,
    updateOrder,
    getAllUsers,
    getUserById,
    updateUser,
    getStats,
    toggleOrderPriority
};

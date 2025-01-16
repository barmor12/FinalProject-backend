import { Request, Response } from 'express';
import Order from '../models/orderModel';
import Cake from '../models/cakeModel';

export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  const { userId, cakeId, quantity } = req.body;

  if (!userId || !cakeId || !quantity) {
    res.status(400).json({ error: "User ID, Cake ID, and quantity are required" });
    return;
  }

  try {
    const cake = await Cake.findById(cakeId);
    if (!cake) {
      res.status(404).json({ error: "Cake not found" });
      return;
    }

    const totalPrice = cake.price * quantity;

    const order = new Order({
      user: userId,
      cake: cakeId,
      quantity,
      totalPrice,
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('Failed to place order:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

// פונקציה זו מחזירה את כל ההזמנות
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate("user", "nickname email")  // הפניית פרטי המשתמש
      .populate("cake", "name price");  // הפניית פרטי העוגה

    res.status(200).json(orders);
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

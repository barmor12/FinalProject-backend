import { Request, Response } from "express";
import Order from "../models/orderModel";
import Cake from "../models/cakeModel";
import User from "../models/userModel";

export const placeOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, cakeId, quantity } = req.body;

  if (!userId || !cakeId || !quantity) {
    res
      .status(400)
      .json({ error: "User ID, Cake ID, and quantity are required" });
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
    console.error("Failed to place order:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
};

// פונקציה זו מחזירה את כל ההזמנות

export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate("user", "nickname email")
      .populate("cake", "name price");

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const saveDraftOrder = async (req: Request, res: Response) => {
  const { userId, cakeId, quantity } = req.body;

  if (!userId || !cakeId || !quantity) {
    res
      .status(400)
      .json({ error: "User ID, Cake ID, and quantity are required" });
    return;
  }

  try {
    const order = new Order({
      user: userId,
      cake: cakeId,
      quantity,
      status: "draft",
      imagePath: req.file?.path || null, // נתיב תמונה אם קיים
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Error saving draft order:", err);
    res.status(500).json({ error: "Failed to save draft order" });
  }
};
export const duplicateOrder = async (req: Request, res: Response) => {
  const { orderId } = req.body;

  try {
    const originalOrder = await Order.findById(orderId);
    if (!originalOrder) {
      res.status(404).json({ error: "Original order not found" });
      return;
    }

    const duplicatedOrder = new Order({
      ...originalOrder.toObject(),
      _id: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedOrder = await duplicatedOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Error duplicating order:", err);
    res.status(500).json({ error: "Failed to duplicate order" });
  }
};
export const applyDiscountCode = async (req: Request, res: Response) => {
  const { orderId, discountCode } = req.body;

  try {
    const validCode = await discountCode.findOne({
      code: discountCode,
      isActive: true,
    });
    if (!validCode) {
      res.status(400).json({ error: "Invalid or expired discount code" });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    order.totalPrice *= 1 - validCode.discountPercentage / 100;
    await order.save();

    res.status(200).json(order);
  } catch (err) {
    console.error("Failed to apply discount code:", err);
    res.status(500).json({ error: "Failed to apply discount code" });
  }
};
export const checkDeliveryDate = async (req: Request, res: Response) => {
  const { date } = req.body;

  if (!date) {
    res.status(400).json({ error: "Date is required" });
    return;
  }

  try {
    const ordersOnDate = await Order.countDocuments({
      deliveryDate: new Date(date),
    });

    // לדוגמה: 10 הזמנות לכל יום מקסימום
    const maxOrdersPerDay = 10;

    if (ordersOnDate >= maxOrdersPerDay) {
      res.status(200).json({ available: false });
    } else {
      res.status(200).json({ available: true });
    }
  } catch (err) {
    console.error("Failed to check delivery date:", err);
    res.status(500).json({ error: "Failed to check delivery date" });
  }
};

export const validateOrderInput = async (req: Request, res: Response) => {
  const { userId, cakeId, quantity } = req.body;

  if (!userId || !cakeId || !quantity) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (quantity <= 0) {
    res.status(400).json({ error: "Quantity must be greater than zero" });
    return;
  }

  try {
    const userExists = await User.exists({ _id: userId });
    const cakeExists = await Cake.exists({ _id: cakeId });

    if (!userExists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!cakeExists) {
      res.status(404).json({ error: "Cake not found" });
      return;
    }

    res.status(200).json({ valid: true });
  } catch (err) {
    console.error("Validation error:", err);
    res.status(500).json({ error: "Failed to validate order" });
  }
};

export default {
  placeOrder,
  getAllOrders,
  saveDraftOrder,
  duplicateOrder,
  applyDiscountCode,
  checkDeliveryDate,
  validateOrderInput,
};

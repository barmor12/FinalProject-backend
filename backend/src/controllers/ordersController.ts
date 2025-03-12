import { Request, Response } from "express";
import Order from "../models/orderModel";
import Cake from "../models/cakeModel";
import User from "../models/userModel";
import DiscountCode from "../models/discountCodeModel";
import mongoose from "mongoose";
import Cart from "../models/cartModel";

export const placeOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, items, paymentMethod, decoration } = req.body;
  console.log("📨 Received Order Request:", req.body); // ✅ בדוק שהבקשה מתקבלת

  if (!userId || !items || items.length === 0) {
    res.status(400).json({ error: "User ID and items are required" });
    return;
  }

  try {
    const cakeIds = items.map((i: any) => i.cakeId);
    const cakes = await Cake.find({ _id: { $in: cakeIds } });

    if (cakes.length !== items.length) {
      res.status(404).json({ error: "One or more cakes not found" });
      return;
    }

    let totalPrice = 0;
    const mappedItems = items
      .map((i: any) => {
        const foundCake = cakes.find((c) => c._id.toString() === i.cakeId);
        if (!foundCake) return null;
        totalPrice += foundCake.price * i.quantity;
        return { cake: i.cakeId, quantity: i.quantity };
      })
      .filter(Boolean);

    const order = new Order({
      user: userId,
      items: mappedItems,
      totalPrice,
      decoration: decoration || "",
      paymentMethod,
      status: "pending",
    });

    const savedOrder = await order.save();
    console.log("✅ Order Saved:", savedOrder); // ✅ וודא שההזמנה נשמרת

    await Cart.deleteOne({ user: userId });

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("🔍 Fetching all orders...");
    const orders = await Order.find()
      .populate("user", "firstName lastName phone address email")
      .populate({
        path: "items.cake",
        select: "name price image",
        strictPopulate: false, // מבטיח שהנתונים יחזרו גם אם cake לא קיים
      });

    console.log("✅ Orders retrieved:", JSON.stringify(orders, null, 2));
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({
      error: "Failed to fetch orders",
      details: (err as Error).message,
    });
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
      imagePath: req.file?.path || null,
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

    const { _id, createdAt, updatedAt, ...orderData } =
      originalOrder.toObject();

    const duplicatedOrder = new Order({
      ...orderData,
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

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400).json({ error: "Invalid order ID format" });
    return;
  }

  try {
    const validCode = await DiscountCode.findOne({
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
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const ordersOnDate = await Order.countDocuments({
      deliveryDate: { $gte: startOfDay, $lte: endOfDay },
    });

    const maxOrdersPerDay = 10;

    res.status(200).json({ available: ordersOnDate < maxOrdersPerDay });
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
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(cakeId)
    ) {
      res.status(400).json({ error: "Invalid ID format" });
      return;
    }

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
export const getDecorations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const decorations = [
      "Sprinkles",
      "Chocolates",
      "Fondant",
      "Fruit Slices",
      "Icing Roses",
    ]; // רשימה קשיחה לדוגמה
    res.status(200).json(decorations);
  } catch (error) {
    console.error("Error fetching decorations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// עדכון סטטוס הזמנה
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["draft", "pending", "confirmed", "delivered"].includes(status)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("❌ Error updating order:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

// מחיקת הזמנה
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // בדיקה אם ה-ID תקין
    if (!orderId) {
      res.status(400).json({ error: "Order ID is required" });
      return;
    }

    // חיפוש ההזמנה במסד הנתונים
    const order = await Order.findById(orderId)
      .populate("user", "firstName lastName phone address email")
      .populate("cake", "name image"); // ✅ לא items.cake אלא פשוט cake

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(order);
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order", details: error.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
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
  getDecorations,
};

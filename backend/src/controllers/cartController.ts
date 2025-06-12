import { Request, Response } from 'express';
import Cart from '../models/cartModel';
import Cake from '../models/cakeModel';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { getTokenFromRequest, sendError } from './authController';

// ממשק עבור נתוני הטוקן
interface TokenPayload extends JwtPayload {
  userId: string;
}

// ✅ פונקציה להוספת מוצר לעגלה
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  const token = getTokenFromRequest(req);
  if (!token) return sendError(res, 'Token required', 401);

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;
    const userId = decoded.userId;
    const { cakeId, quantity } = req.body;

    if (!cakeId || !quantity) {
      res.status(400).json({ error: 'Cake ID and quantity are required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(cakeId)) {
      res.status(400).json({ error: 'Invalid Cake ID format' });
      return;
    }

    const cake = await Cake.findById(cakeId);
    if (!cake) {
      res.status(404).json({ error: 'Cake not found' });
      return;
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    if (!cart.items) cart.items = [];

    const existingItem = cart.items.find(
      (item) => item.cake.toString() === cakeId
    );
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        cake: cakeId,
        quantity,
      });
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error('Failed to add cake to cart:', err);
    res.status(500).json({ error: 'Failed to add cake to cart' });
  }
};

// ✅ פונקציה לעדכון כמות מוצר בעגלה
export const updateCartItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log('🔹 Received request to update item:', req.body);
  const token = getTokenFromRequest(req);
  if (!token) return sendError(res, 'Token required', 401);

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;
    const userId = decoded.userId;
    const { itemId, quantity } = req.body;

    if (!itemId || quantity < 1) {
      console.log('🚨 Invalid request data:', req.body);
      res
        .status(400)
        .json({ error: 'Valid item ID and quantity are required' });
      return;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      console.log('🚨 Cart not found for user:', userId);
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    const item = cart.items.find((item) => item._id?.toString() === itemId);
    if (!item) {
      console.log(
        '🚨 Item not found in cart:',
        itemId,
        'Available items:',
        cart.items
      );
      res.status(404).json({ error: 'Item not found in cart' });
      return;
    }

    item.quantity = quantity;
    await cart.save();
    console.log('✅ Updated cart item:', item);
    res.status(200).json(cart);
  } catch (err) {
    console.error('❌ Failed to update cart item:', err);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};

// ✅ פונקציה לקבלת עגלה
export const getCart = async (req: Request, res: Response): Promise<void> => {
  const token = getTokenFromRequest(req);
  if (!token) return sendError(res, 'Token required', 401);

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;
    const userId = decoded.userId;

    const cart = await Cart.findOne({ user: userId }).populate('items.cake');
    if (!cart) {
      res.status(200).json({ items: [] });
      return;
    }

    res.status(200).json(cart);
  } catch (err) {
    console.error('Failed to fetch cart:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

// ✅ פונקציה להסרת מוצר מהעגלה
export const removeFromCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log('🔹 Received request to remove item:', req.body); // 🚀 הדפסת הקלט הנכנס לשרת

  const token = getTokenFromRequest(req);
  if (!token) return sendError(res, 'Token required', 401);

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;
    const userId = decoded.userId;
    const { itemId } = req.body; // Fix: Use itemId instead of cakeId

    if (!itemId) {
      console.log('🚨 Missing itemId in request');
      res.status(400).json({ error: 'Item ID is required' });
      return;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      console.log('🚨 Cart not found for user:', userId);
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => {
      // Handle possible undefined _id
      return item._id ? item._id.toString() !== itemId : false;
    });

    if (cart.items.length === initialLength) {
      console.log('🚨 Item ID not found in cart:', itemId);
      res.status(404).json({ error: 'Item not found in cart' });
      return;
    }

    await cart.save();
    console.log('✅ Removed item from cart:', itemId);
    res.status(200).json(cart);
  } catch (err) {
    console.error('❌ Failed to remove item from cart:', err);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// ✅ פונקציה לניקוי כל העגלה
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  const token = getTokenFromRequest(req);
  if (!token) return sendError(res, 'Token required', 401);

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;
    const userId = decoded.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (err) {
    console.error('Failed to clear cart:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

export default {
  addToCart,
  updateCartItem,
  getCart,
  removeFromCart,
  clearCart,
};

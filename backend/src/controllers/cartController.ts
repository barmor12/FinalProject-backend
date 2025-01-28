import { Request, Response } from "express";
import Cart from "../models/cartModel";
import Cake from "../models/cakeModel";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { getTokenFromRequest, sendError } from "./authController";

// ממשק עבור נתוני הטוקן
interface TokenPayload extends JwtPayload {
    userId: string;
}

// ✅ הוספת עוגה לעגלה
export const addToCart = async (req: Request, res: Response): Promise<void> => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
        const userId = decoded.userId;
        const { cakeId, quantity } = req.body;

        if (!cakeId || !quantity) {
            res.status(400).json({ error: "Cake ID and quantity are required" });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(cakeId)) {
            res.status(400).json({ error: "Invalid Cake ID format" });
            return;
        }

        const cake = await Cake.findById(cakeId);
        if (!cake) {
            res.status(404).json({ error: "Cake not found" });
            return;
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        const existingItem = cart.items.find((item) => item.cake.toString() === cakeId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ cake: cakeId, quantity });
        }

        const updatedCart = await cart.save();
        res.status(200).json(updatedCart);
    } catch (err) {
        console.error("Failed to add cake to cart:", err);
        res.status(500).json({ error: "Failed to add cake to cart" });
    }
};

// ✅ קבלת כל הפריטים בעגלה
export const getCart = async (req: Request, res: Response): Promise<void> => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
        const userId = decoded.userId;

        const cart = await Cart.findOne({ user: userId }).populate("items.cake");
        if (!cart) {
            res.status(200).json({ items: [] });
            return;
        }

        res.status(200).json(cart);
    } catch (err) {
        console.error("Failed to fetch cart:", err);
        res.status(500).json({ error: "Failed to fetch cart" });
    }
};

// ✅ הסרת עוגה מהעגלה
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
        const userId = decoded.userId;
        const { cakeId } = req.body;

        if (!cakeId) {
            res.status(400).json({ error: "Cake ID is required" });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(cakeId)) {
            res.status(400).json({ error: "Invalid Cake ID format" });
            return;
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            res.status(404).json({ error: "Cart not found" });
            return;
        }

        cart.items = cart.items.filter((item) => item.cake.toString() !== cakeId);
        const updatedCart = await cart.save();

        res.status(200).json(updatedCart);
    } catch (err) {
        console.error("Failed to remove cake from cart:", err);
        res.status(500).json({ error: "Failed to remove cake from cart" });
    }
};

// ✅ ניקוי עגלה
export const clearCart = async (req: Request, res: Response): Promise<void> => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
        const userId = decoded.userId;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            res.status(404).json({ error: "Cart not found" });
            return;
        }

        cart.items = [];
        await cart.save();

        res.status(200).json({ message: "Cart cleared successfully" });
    } catch (err) {
        console.error("Failed to clear cart:", err);
        res.status(500).json({ error: "Failed to clear cart" });
    }
};

export default {
    addToCart,
    getCart,
    removeFromCart,
    clearCart,
};

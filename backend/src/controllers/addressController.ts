import { Request, Response } from "express";
import Address from "../models/addressModel";
import User from "../models/userModel";
import mongoose from "mongoose";

export const getUserAddresses = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || req.body.userId;
        console.log("🔍 User ID from request:", userId);

        if (!userId) {
            res.status(401).json({ message: "Unauthorized. No user found." });
            return;
        }

        const addresses = await Address.find({ userId });
        console.log("🔍 Found Addresses:", addresses);

        res.json(addresses);
    } catch (error) {
        console.error("❌ Error fetching addresses:", error);
        res.status(500).json({ message: "Failed to fetch addresses.", error });
    }
};


// 📍 הוספת כתובת חדשה
export const addAddress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || req.body.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized. No user found." });
            return;
        }

        const { fullName, phone, street, city, isDefault } = req.body;

        // אם הכתובת מוגדרת כברירת מחדל, נסיר את כל השאר מברירת מחדל
        if (isDefault) {
            await Address.updateMany({ userId }, { isDefault: false });
        }

        // יצירת כתובת חדשה
        const newAddress = new Address({ userId, fullName, phone, street, city, isDefault });
        await newAddress.save();

        // ✅ עדכון המשתמש ושיוך הכתובת אליו
        await User.findByIdAndUpdate(
            userId,
            { $push: { addresses: newAddress._id } }, // הוספת הכתובת למערך
            { new: true }
        );

        res.status(201).json({ message: "Address added successfully.", address: newAddress });
    } catch (error) {
        console.error("❌ Error adding address:", error);
        res.status(500).json({ message: "Failed to add address.", error });
    }
};

export const setDefaultAddress = async (req: Request, res: Response) => {
    try {
        const { addressId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            res.status(400).json({ error: "Invalid address ID" });
            return;
        }

        const address = await Address.findById(addressId);

        if (!address) {
            res.status(404).json({ error: "Address not found" });
            return;
        }

        // הסרת הסטטוס 'ברירת מחדל' מכל שאר הכתובות של המשתמש
        await Address.updateMany({ userId: address.userId }, { isDefault: false });

        // עדכון הכתובת שבחרנו להיות ברירת מחדל
        address.isDefault = true;
        await address.save();

        res.status(200).json({ message: "Default address updated successfully", address });
    } catch (error) {
        console.error("❌ Error setting default address:", error);
        res.status(500).json({ error: "Failed to update default address" });
    }
};

// 📍 עדכון כתובת קיימת
export const updateAddress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || req.body.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized. No user found." });
            return;
        }

        const addressId = req.params.id;
        const { fullName, phone, street, city, isDefault } = req.body;

        const existingAddress = await Address.findOne({ _id: addressId, userId });
        if (!existingAddress) {
            res.status(404).json({ message: "Address not found or does not belong to the user." });
            return;
        }

        if (isDefault) {
            await Address.updateMany({ userId }, { isDefault: false });
        }

        const updatedAddress = await Address.findByIdAndUpdate(
            addressId,
            { fullName, phone, street, city, isDefault },
            { new: true }
        );

        res.json({ message: "Address updated successfully.", address: updatedAddress });
    } catch (error) {
        console.error("❌ Error updating address:", error);
        res.status(500).json({ message: "Failed to update address.", error });
    }
};

// 📍 מחיקת כתובת
export const deleteAddress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || req.body.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized. No user found." });
            return;
        }

        const addressId = req.params.id;

        const existingAddress = await Address.findOne({ _id: addressId, userId });
        if (!existingAddress) {
            res.status(404).json({ message: "Address not found or does not belong to the user." });
            return;
        }

        await Address.findByIdAndDelete(addressId);
        res.json({ message: "Address deleted successfully." });
    } catch (error) {
        console.error("❌ Error deleting address:", error);
        res.status(500).json({ message: "Failed to delete address.", error });
    }
};
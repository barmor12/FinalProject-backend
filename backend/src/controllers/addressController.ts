import { Request, Response } from "express";
import Address from "../models/addressModel";

export const getUserAddresses = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?._id || req.body.userId;
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
        const userId = (req as any).user?._id || req.body.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized. No user found." });
            return;
        }

        const { fullName, phone, street, city, zipCode, country, isDefault } = req.body;

        if (isDefault) {
            await Address.updateMany({ userId }, { isDefault: false });
        }

        const newAddress = new Address({ userId, fullName, phone, street, city, zipCode, country, isDefault });
        await newAddress.save();

        res.status(201).json({ message: "Address added successfully.", address: newAddress });
    } catch (error) {
        console.error("❌ Error adding address:", error);
        res.status(500).json({ message: "Failed to add address.", error });
    }
};

// 📍 עדכון כתובת קיימת
export const updateAddress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?._id || req.body.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized. No user found." });
            return;
        }

        const addressId = req.params.id;
        const { fullName, phone, street, city, zipCode, country, isDefault } = req.body;

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
            { fullName, phone, street, city, zipCode, country, isDefault },
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
        const userId = (req as any).user?._id || req.body.userId;
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

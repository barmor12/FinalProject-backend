import { Request, Response } from "express";
import DiscountCode, { IDiscountCode } from "../models/discountCodeModel";

// יצירת קוד הנחה
export const createDiscountCode = async (req: Request, res: Response) => {
    try {
        const { code, discountPercentage, expiryDate } = req.body;

        if (!code || discountPercentage == null) {
            res.status(400).json({ message: "Code and discount are required." });
            return;
        }

        const foundCode = await DiscountCode.findOne({ code }) as IDiscountCode;
        if (foundCode) {
            res.status(409).json({ message: "Code already exists." });
            return;
        }

        const newCode = new DiscountCode({
            code,
            discountPercentage,
            expiryDate,
        });

        await newCode.save();
        res.status(201).json(newCode);
    } catch (error) {
        console.error("Error creating code:", error);
        res.status(500).json({ message: "Failed to create discount code." });
    }
};

// שליפת כל הקודים
export const getAllDiscountCodes = async (_req: Request, res: Response) => {
    try {
        const codes = await DiscountCode.find().sort({ createdAt: -1 });
        res.json(codes);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch discount codes." });
    }
};

// אימות קוד הנחה
export const validateDiscountCode = async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        if (!code) {
            res.status(400).json({ message: "Code is required" });
            return;
        }

        const discountCode = await DiscountCode.findOne({ code });
        if (!discountCode) {
            res.status(404).json({ message: "Discount code not found" });
            return;
        }

        const now = new Date();
        const isExpired = discountCode.expiryDate && now > discountCode.expiryDate;

        if (!discountCode.isActive || isExpired) {
            res.status(400).json({ message: "Code is invalid or expired" });
            return;
        }

        res.status(200).json({
            valid: true,
            discountPercentage: discountCode.discountPercentage,
        });
    } catch (err) {
        console.error("[ERROR] Validating discount code:", err);
        res.status(500).json({ message: "Server error" });
    }
};
// מחיקת קוד
export const deleteDiscountCode = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await DiscountCode.findByIdAndDelete(id);
        if (!deleted) {
            res.status(404).json({ message: "Discount code not found" });
            return;
        }

        res.status(200).json({ message: "Discount code deleted successfully" });
    } catch (err) {
        console.error("[ERROR] Deleting discount code:", err);
        res.status(500).json({ message: "Server error" });
    }
};

import { Request, Response } from "express";
import User from "../models/userModel";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getTokenFromRequest, sendError } from "./authController";
import cloudinary from "../config/cloudinary";

interface TokenPayload extends JwtPayload {
    userId: string;
}

export const updateUserName = async (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: string };
        const user = await User.findById(decoded.userId);

        if (!user) {
            return sendError(res, "User not found", 404);
        }

        const { firstName, lastName } = req.body;

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;

        const updatedUser = await user.save();

        res.status(200).json({
            message: "Name updated successfully",
            user: updatedUser,
        });
    } catch (err) {
        console.error("Update name error:", err);
        sendError(res, "Failed to update name", 500);
    }
};

// פונקציה לעדכון תמונת פרופיל
export const updateUserProfilePic = async (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: string };
        const user = await User.findById(decoded.userId);

        if (!user) {
            return sendError(res, "User not found", 404);
        }

        if (!req.file) {
            return sendError(res, "No image provided", 400);
        }

        // בדיקת תקינות סוג הקובץ
        if (!req.file.mimetype.startsWith("image/")) {
            return sendError(res, "Invalid file type. Only images are allowed.", 400);
        }

        console.log("Uploading new profile picture...");

        // שליחת הודעת התחלת טעינה
        res.status(202).json({ message: "Uploading image..." });

        // אם קיימת תמונה ישנה, מחק אותה לפני העלאת החדשה
        if (user.profilePic && user.profilePic.public_id) {
            await cloudinary.uploader.destroy(user.profilePic.public_id);
        }

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "users"
        });
        console.log("Upload completed:", uploadResult.secure_url);

        user.profilePic = {
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
        };

        const updatedUser = await user.save();

        res.status(200).json({
            message: "Profile picture updated successfully",
            user: updatedUser,
        });
    } catch (err) {
        console.error("Update profile picture error:", err);
        sendError(res, "Failed to update profile picture", 500);
    }
};


export const updateRecoveryEmail = async (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
        const user = await User.findById(decoded.userId);

        if (!user) {
            return sendError(res, "User not found", 404);
        }

        const { recoveryEmail } = req.body;

        if (!recoveryEmail || typeof recoveryEmail !== "string") {
            return sendError(res, "Invalid recovery email", 400);
        }

        user.recoveryEmail = recoveryEmail;
        await user.save();

        res.status(200).json({
            message: "Recovery email updated successfully",
            recoveryEmail: user.recoveryEmail
        });
    } catch (err) {
        console.error("Update recovery email error:", err);
        sendError(res, "Failed to update recovery email", 500);
    }
};

export const getProfile = async (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET!
        ) as TokenPayload;

        const user = await User.findById(decoded.userId).select("-password -refresh_tokens");
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        res.status(200).send(user);
    } catch (err) {
        console.error("Get profile error:", err);
        sendError(res, "Failed to get profile", 500);
    }
};

export const deleteProfile = async (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET!
        ) as TokenPayload;

        const user = await User.findById(decoded.userId);
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        if (user.profilePic && user.profilePic.public_id) {
            console.log("profilePic", user.profilePic);
            console.log("publicID", user.profilePic.public_id);
            await cloudinary.uploader.destroy(user.profilePic?.public_id);
        }

        await User.findByIdAndDelete(decoded.userId);

        res.status(200).json({
            message: "Profile deleted successfully",
        });
    } catch (err) {
        console.error("Delete profile error:", err);
        sendError(res, "Failed to delete profile", 500);
    }
};


export default {
    getProfile,
    updateUserName,
    updateUserProfilePic,
    deleteProfile,
};
import { Request, Response } from "express";
import User from "../models/userModel";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getTokenFromRequest, sendError } from "./authController";
import bcrypt from 'bcryptjs';

interface TokenPayload extends JwtPayload {
    _id: string;
}

export const updateProfile = async (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET!
        ) as TokenPayload;

        const user = await User.findById(decoded._id);
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        const { firstName, lastName, email, oldPassword, newPassword } = req.body;
        if (oldPassword && newPassword) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return sendError(res, "Old password is incorrect", 400);
            }
            user.password = await bcrypt.hash(newPassword, 10);
        }

        if (req.file) {
            user.profilePic = `/uploads/${req.file.filename}`;
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;

        const updatedUser = await user.save();
        console.log(updatedUser);
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (err) {
        console.error("Update profile error:", err);
        sendError(res, "Failed to update profile", 500);
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

        const user = await User.findById(decoded._id).select(
            "-password -refresh_tokens"
        );
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        res.status(200).send(user);
    } catch (err) {
        console.error("Get profile error:", err);
        sendError(res, "Failed to get profile", 500);
    }
};

export default {
    getProfile,
    updateProfile
};

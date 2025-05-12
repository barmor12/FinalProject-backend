import { Request, Response } from "express";
import User from "../models/userModel";
import logger from "../logger";
import jwt from "jsonwebtoken";

// Store a user's push token
export const updatePushToken = async (req: Request, res: Response) => {
    try {
        // Get the token from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: "No token provided" });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: string, role: string };

        // Get token from request body
        const { pushToken } = req.body;

        if (!pushToken) {
            res.status(400).json({ message: "Push token is required" });
            return;
        }

        // Find user and update their push tokens
        const user = await User.findById(decoded.userId);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Check if token already exists
        if (!user.pushTokens.includes(pushToken)) {
            // Add the new token to the array
            user.pushTokens.push(pushToken);
            await user.save();
            logger.info(`[INFO] Push token added for user: ${decoded.userId}`);
        }

        res.status(200).json({ message: "Push token updated successfully" });
    } catch (error: any) {
        logger.error(`[ERROR] Failed to update push token: ${error.message}`);
        res.status(500).json({ message: "Failed to update push token" });
    }
};

// Remove a push token
export const removePushToken = async (req: Request, res: Response) => {
    try {
        // Get the token from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: "No token provided" });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: string, role: string };

        // Get token from request body
        const { pushToken } = req.body;

        if (!pushToken) {
            res.status(400).json({ message: "Push token is required" });
            return;
        }

        // Find user and remove the push token
        const user = await User.findById(decoded.userId);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Filter out the token to remove
        user.pushTokens = user.pushTokens.filter(t => t !== pushToken);
        await user.save();
        logger.info(`[INFO] Push token removed for user: ${decoded.userId}`);

        res.status(200).json({ message: "Push token removed successfully" });
    } catch (error: any) {
        logger.error(`[ERROR] Failed to remove push token: ${error.message}`);
        res.status(500).json({ message: "Failed to remove push token" });
    }
};

// Get all push tokens (admin only)
export const getAllPushTokens = async (req: Request, res: Response) => {
    try {
        // Get the token from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: "No token provided" });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: string, role: string };

        // Check if user is admin
        if (decoded.role !== "admin") {
            res.status(403).json({ message: "Unauthorized: Admin access required" });
            return;
        }

        // Aggregate all push tokens
        const users = await User.find({ pushTokens: { $exists: true, $ne: [] } });

        // Extract all tokens
        const allTokens = users.reduce((tokens: string[], user) => {
            return tokens.concat(user.pushTokens);
        }, []);

        res.status(200).json({
            totalTokens: allTokens.length,
            tokens: allTokens
        });
    } catch (error: any) {
        logger.error(`[ERROR] Failed to get push tokens: ${error.message}`);
        res.status(500).json({ message: "Failed to get push tokens" });
    }
};

// Send a notification to specific users or all users
export const sendNotification = async (req: Request, res: Response) => {
    try {
        // Get the token from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: "No token provided" });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: string, role: string };

        // Check if user is admin
        if (decoded.role !== "admin") {
            res.status(403).json({ message: "Unauthorized: Admin access required" });
            return;
        }

        const { title, body, data, userIds } = req.body;

        if (!title || !body) {
            res.status(400).json({ message: "Title and body are required" });
            return;
        }

        let targetUsers;

        // If userIds is provided, send to specific users
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            targetUsers = await User.find({
                _id: { $in: userIds },
                pushTokens: { $exists: true, $ne: [] }
            });
        } else {
            // Otherwise, send to all users
            targetUsers = await User.find({
                pushTokens: { $exists: true, $ne: [] }
            });
        }

        if (targetUsers.length === 0) {
            res.status(404).json({ message: "No users with push tokens found" });
            return;
        }

        // Extract all tokens from target users
        const pushTokens = targetUsers.reduce((tokens: string[], user) => {
            return tokens.concat(user.pushTokens);
        }, []);

        logger.info(`[INFO] Preparing to send notification to ${pushTokens.length} devices`);

        // This is a placeholder - in production you would use a push notification service
        // like Firebase Cloud Messaging, Expo Push Notifications, etc.
        const notificationResult = {
            success: true,
            message: `Notification would be sent to ${pushTokens.length} devices`,
            tokens: pushTokens
        };

        // Here you would implement the actual sending using a service like:
        // await sendPushNotifications(pushTokens, { title, body, data });

        res.status(200).json(notificationResult);
    } catch (error: any) {
        logger.error(`[ERROR] Failed to send notification: ${error.message}`);
        res.status(500).json({ message: "Failed to send notification" });
    }
};

export default {
    updatePushToken,
    removePushToken,
    getAllPushTokens,
    sendNotification
}; 
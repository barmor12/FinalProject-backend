import express from "express";
import { updatePushToken, removePushToken, getAllPushTokens, sendNotification } from "../controllers/notificationController";
import authenticateMiddleware from "../common/authMiddleware"; // אם יש צורך
import authenticateAdminMiddleware from '../common/authAdminMiddleware';

const router = express.Router();

// Update a user's push token
router.post("/push-token", authenticateMiddleware, updatePushToken);

// Remove a user's push token
router.delete("/push-token", authenticateMiddleware, removePushToken);

// Get all push tokens (admin only)
router.get("/push-tokens", authenticateAdminMiddleware, getAllPushTokens);

// Send notification (admin only)
router.post("/send", authenticateAdminMiddleware, sendNotification);

export default router; 
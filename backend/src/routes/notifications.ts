import { Router, Request, Response } from "express";
import { Expo } from "expo-server-sdk";
import { PushToken } from "../models/PushToken";
import { NotificationLog } from "../models/NotificationLog";
import { sendOrderStatusChangeNotification } from "../services/notificationService";
import authenticateMiddleware from "../common/authMiddleware";

const expo = new Expo();
export const notificationsRouter = Router();

// POST /notifications/register
notificationsRouter.post(
  "/register",
  authenticateMiddleware,
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }
    const { token } = req.body;
    if (!Expo.isExpoPushToken(token)) {
      res.status(400).json({ error: "Invalid push token" });
      return;
    }
    await PushToken.findOneAndUpdate(
      { token },
      { userId, token, sentAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  }
);

// POST /notifications/send
notificationsRouter.post(
  "/send",
  authenticateMiddleware,
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }
    const { title, message, type } = req.body as {
      title: string;
      message: string;
      type: string;
    };
    const tokens = (await PushToken.find({ token: { $ne: null } }))
      .map((t) => t.token)
      .filter((t) => Expo.isExpoPushToken(t));

    // Group messages by experienceId to avoid PUSH_TOO_MANY_EXPERIENCE_IDS
    const messagesByExperience: { [experienceId: string]: any[] } = {};

    for (const token of tokens) {
      const experienceId =
        token.includes("E3gJ0EKS") || token.includes("4vnC75Kl")
          ? "@avieles100/CakeBusinessApp"
          : "@barmor12/CakeBusinessApp";

      if (!messagesByExperience[experienceId]) {
        messagesByExperience[experienceId] = [];
      }

      messagesByExperience[experienceId].push({
        to: token,
        sound: "default" as const,
        title,
        body: message,
        data: { type },
      });
    }

    // Flatten all messages to check if there are any messages to send
    const allMessages = Object.values(messagesByExperience).flat();
    if (allMessages.length === 0) {
      return res.status(400).json({ error: "No push tokens available" });
    }

    let sentCount = 0;
    for (const experienceId in messagesByExperience) {
      const chunks = expo.chunkPushNotifications(
        messagesByExperience[experienceId]
      );
      for (const chunk of chunks) {
        try {
          const tickets = await expo.sendPushNotificationsAsync(chunk);
          sentCount += tickets.length;
        } catch (err) {
          const tickets = await expo.sendPushNotificationsAsync(chunk);
          sentCount += tickets.length;
        }
      }
    }

    await NotificationLog.create({
      userId,
      type: type as any,
      title,
      body: message,
      sentTo: sentCount,
      sentAt: new Date(),
    });
    console.log("📨 Notification sent:", { title, message, sentTo: sentCount });

    res.json({ ok: true, sentTo: sentCount });
  }
);

// GET /notifications/recent
notificationsRouter.get(
  "/recent",
  authenticateMiddleware,
  async (req: Request, res: Response): Promise<any> => {
    const logs = await NotificationLog.find().sort({ sentAt: -1 }).limit(20);
    res.json(logs);
  }
);

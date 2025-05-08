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
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { token } = req.body;
    if (!Expo.isExpoPushToken(token)) {
      res.status(400).json({ error: "Invalid push token" });
      return;
    }
    await PushToken.findOneAndUpdate(
      { token },
      { userId, token },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  }
);

// POST /notifications/send
notificationsRouter.post(
  "/send",
  authenticateMiddleware,
  async (req: Request, res: Response) => {
    const { title, message, type } = req.body as {
      title: string;
      message: string;
      type: string;
    };
    const tokens = (await PushToken.find()).map((t) => t.token);

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default" as const,
      title,
      body: message,
      data: { type },
    }));

    const chunks = expo.chunkPushNotifications(messages);
    let sentCount = 0;
    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        sentCount += tickets.length;
      } catch {
        // retry once
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        sentCount += tickets.length;
      }
    }

    await NotificationLog.create({
      userId: (req as any).user.id,
      type: type as any,
      title,
      body: message,
      sentTo: sentCount,
    });

    res.json({ ok: true, sentTo: sentCount });
    return;
  }
);

// GET /notifications/recent
notificationsRouter.get(
  "/recent",
  authenticateMiddleware,
  async (req: Request, res: Response) => {
    const logs = await NotificationLog.find().sort({ sentAt: -1 }).limit(20);
    res.json(logs);
  }
);

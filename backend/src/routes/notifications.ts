import { Router, Request, Response } from 'express';
import { Expo } from 'expo-server-sdk';
import { PushToken } from '../models/PushToken';
import { NotificationLog } from '../models/NotificationLog';
import { sendOrderStatusChangeNotification } from '../services/notificationService';
import authenticateMiddleware from '../common/authMiddleware';
import mongoose from 'mongoose';
import User from '../models/userModel';

const expo = new Expo();
export const notificationsRouter = Router();

// POST /notifications/register
notificationsRouter.post(
  '/register',
  authenticateMiddleware,
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    const { token } = req.body;
    if (!Expo.isExpoPushToken(token)) {
      res.status(400).json({ error: 'Invalid push token' });
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
  '/send',
  authenticateMiddleware,
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    const { title, message, type } = req.body as {
      title: string;
      message: string;
      type: string;
    };
    // Get all token docs so we can use .token and potentially other info
    const tokens = await PushToken.find({ token: { $ne: null } });

    // Group messages by Expo project experienceId
    const groupedMessages: Record<string, any[]> = {};

    for (const tokenDoc of tokens) {
      const token = tokenDoc.token;
      if (!Expo.isExpoPushToken(token)) continue;

      // Determine projectId/experienceId from the token value
      let projectId = '@default';
      if (
        token.includes('P95Qo1E7GAqqIOYxfBXveY') ||
        token.includes('dYa9pnHufwSNzsqM37S7QQ')
      ) {
        projectId = '@barmor12/CakeBusinessApp';
      } else if (
        token.includes('E3gJ0EKS9DTbctstQkmTG2') ||
        token.includes('4vnC75Kl5-G41y-MaKGN7o')
      ) {
        projectId = '@avieles100/CakeBusinessApp';
      }

      if (!groupedMessages[projectId]) groupedMessages[projectId] = [];

      groupedMessages[projectId].push({
        to: token,
        sound: 'default',
        title,
        body: message,
        data: { type },
      });
    }

    // Flatten all messages to check if there are any messages to send
    const allMessages = Object.values(groupedMessages).flat();
    if (allMessages.length === 0) {
      return res.status(400).json({ error: 'No push tokens available' });
    }

    let sentCount = 0;
    // Send notifications per projectId (experience)
    for (const [projectId, messages] of Object.entries(groupedMessages)) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          const tickets = await expo.sendPushNotificationsAsync(chunk);
          sentCount += tickets.length;
          console.log(`✅ נשלחו התראות ל-${projectId}`);
        } catch (error) {
          console.error(`❌ שגיאה בשליחת התראות ל-${projectId}:`, error);
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
    console.log('📨 Notification sent:', { title, message, sentTo: sentCount });

    res.json({ ok: true, sentTo: sentCount });
  }
);

// GET /notifications/recent
notificationsRouter.get(
  '/recent',
  authenticateMiddleware,
  async (req: Request, res: Response): Promise<any> => {
    const logs = await NotificationLog.find().sort({ sentAt: -1 }).limit(20);
    res.json(logs);
  }
);

// POST /notifications/user/:userId
notificationsRouter.post(
  '/user/:userId',
  authenticateMiddleware,
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.params;
    const { title, body, type } = req.body;

    const tokenDocs = await PushToken.find({ userId });
    if (!tokenDocs.length) {
      return res.status(404).json({ error: 'No tokens found for user' });
    }

    const messages = tokenDocs
      .map((doc) => doc.token)
      .filter((token) => Expo.isExpoPushToken(token))
      .map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: { type },
      }));

    const chunks = expo.chunkPushNotifications(messages);
    let sentCount = 0;

    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        sentCount += tickets.length;
      } catch (err) {
        console.error('Error sending push notifications:', err);
      }
    }

    await NotificationLog.create({
      userId,
      type,
      title,
      body,
      sentTo: sentCount,
      sentAt: new Date(),
    });

    res.json({ ok: true, sentTo: sentCount });
  }
);


// Utility function to get all admin user IDs
async function getAdminUserIds(): Promise<mongoose.Types.ObjectId[]> {
  // Ensure User model is imported above
  const admins = await User.find({ role: 'admin' }, { _id: 1 });
  return admins.map((admin) => admin._id);
}

// שליחת התראה לאדמין כשנכנסת הזמנה חדשה
export async function notifyAdminOfNewOrder(orderId: string) {
  try {
    const adminUserIds = await getAdminUserIds(); // This function should return an array of admin user IDs
    const adminTokens = await PushToken.find({ userId: { $in: adminUserIds } });

    const messages = adminTokens
      .map((doc) => doc.token)
      .filter((token) => Expo.isExpoPushToken(token))
      .map((token) => ({
        to: token,
        sound: 'default',
        title: '📦 New Order',
        body: `Incoming A New Order: ${orderId.slice(-6)}`,
        data: { type: 'new_order', orderId },
      }));

    if (!messages.length) {
      console.warn('⚠️ No valid admin push tokens found');
      return;
    }

    const chunks = expo.chunkPushNotifications(messages);
    let sentCount = 0;

    for (const chunk of chunks) {
      try {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        sentCount += receipts.length;
      } catch (err) {
        console.error('❌ Failed sending to admin chunk', err);
      }
    }

    for (const adminId of adminUserIds) {
      await NotificationLog.create({
        userId: adminId,
        type: 'new_order',
        title: '📦 New Order',
        body: `Incoming A New Order: ${orderId.slice(-6)}`,
        sentTo: sentCount,
        sentAt: new Date(),
      });
    }

    console.log('📨 Admins notified of new order');
  } catch (err) {
    console.error('❌ Failed to notify admin of new order', err);
  }
}

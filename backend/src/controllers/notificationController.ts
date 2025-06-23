import { Request, Response } from 'express';
import { Expo } from 'expo-server-sdk';
import { PushToken } from '../models/PushToken';
import { NotificationLog, NotificationType } from '../models/NotificationLog';
import mongoose from 'mongoose';
import User from '../models/userModel';

const expo = new Expo();

export const registerPushToken = async (req: Request, res: Response): Promise<void> => {
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
};

export const sendNotificationToAll = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }

  const { title, message, type } = req.body;
  const tokens = await PushToken.find({ token: { $ne: null } });

  const groupedMessages: Record<string, any[]> = {};

  for (const tokenDoc of tokens) {
    const token = tokenDoc.token;
    if (!Expo.isExpoPushToken(token)) continue;

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

  const allMessages = Object.values(groupedMessages).flat();
  if (allMessages.length === 0) {
    res.status(400).json({ error: 'No push tokens available' });
    return;
  }

  let sentCount = 0;
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
    type,
    title,
    body: message,
    sentTo: sentCount,
    sentAt: new Date(),
  });

  console.log('📨 Notification sent:', { title, message, sentTo: sentCount });

  res.json({ ok: true, sentTo: sentCount });
};

export const getRecentNotifications = async (req: Request, res: Response): Promise<void> => {
  const logs = await NotificationLog.find().sort({ sentAt: -1 }).limit(20);
  res.json(logs);
};


// Utility function
async function getAdminUserIds(): Promise<mongoose.Types.ObjectId[]> {
  const admins = await User.find({ role: 'admin' }, { _id: 1 });
  return admins.map((admin) => admin._id);
}

// שליחת התראה לאדמין
export async function notifyAdminOfNewOrder(orderId: string): Promise<void> {
  try {
    const adminUserIds = await getAdminUserIds();
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
/**
 * שולחת התראה למשתמש לפי userId והטוקנים שלו
 */
export async function sendNotificationToUser(
  userId: string,
  {
    title,
    body,
    type,
  }: { title: string; body: string; type: NotificationType }
): Promise<void> {
  const tokenDocs = await PushToken.find({ userId });
  console.log('🧠 userId:', userId);
  console.log('📦 tokenDocs:', tokenDocs);
  console.log('📲 כל הטוקנים שנמצאו:', tokenDocs.map(d => d.token));

  const tokens = tokenDocs
    .map((doc) => doc.token)
    .filter((token) => token && Expo.isExpoPushToken(token));

  console.log('✅ טוקנים תקפים:', tokens);

  if (!tokens.length) {
    console.warn('⚠️ אין טוקנים תקפים למשתמש:', userId);
    return;
  }

  const messages = tokens.map((token) => ({
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
      console.error('Error sending push notification to user:', err);
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
}

/**
 * שולחת התראה לכל המשתמשים עם role 'admin'
 */
export async function sendNotificationToAdmins({
  title,
  body,
  type,
}: { title: string; body: string; type?: NotificationType }): Promise<void> {
  const adminUserIds = await getAdminUserIds();
  const adminTokens = await PushToken.find({ userId: { $in: adminUserIds } });

  const messages = adminTokens
    .map((doc) => doc.token)
    .filter((token) => Expo.isExpoPushToken(token))
    .map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: { type },
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
      console.error('❌ Failed sending notification to admins chunk', err);
    }
  }

  for (const adminId of adminUserIds) {
    await NotificationLog.create({
      userId: adminId,
      type,
      title,
      body,
      sentTo: sentCount,
      sentAt: new Date(),
    });
  }
}

/**
 * שולחת התראה על שינוי סטטוס הזמנה למשתמש
 * @param params אובייקט עם userId, orderId, newStatus, locale (אופציונלי)
 */
export async function sendOrderStatusChangeNotification(params: {
  userId: string;
  orderId: string;
  newStatus: string;
  locale?: string;
}): Promise<void> {
  const { userId, orderId, newStatus, locale = 'he' } = params;
  let title: string;
  let body: string;
  if (locale === 'he') {
    title = 'עדכון סטטוס הזמנה';
    body = `הסטטוס של ההזמנה שלך (${orderId.slice(-6)}) עודכן ל: ${newStatus}`;
  } else {
    title = 'Order Status Update';
    body = `Your order (${orderId.slice(-6)}) status changed to: ${newStatus}`;
  }
  await sendNotificationToUser(userId, {
    title,
    body,
    type: 'order_status_change' as NotificationType,
  });
  await NotificationLog.create({
    userId,
    type: 'order_status_change',
    title,
    body,
    sentTo: 1,
    sentAt: new Date(),
  });
}
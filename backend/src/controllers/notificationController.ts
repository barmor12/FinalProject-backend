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

  try {
    await PushToken.findOneAndUpdate(
      { token },
      { userId: new mongoose.Types.ObjectId(userId), token, sentAt: new Date() },
      { upsert: true, new: true }
    );
    console.log('✅ Successfully registered push token for user:', userId, 'token:', token);
    res.json({ ok: true });
  } catch (error) {
    console.error('❌ Failed to register push token:', error);
    res.status(500).json({ error: 'Failed to register push token' });
  }
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
        console.log(`✅ Notifications sent to project: ${projectId}`);
      } catch (error) {
        console.error(`❌ Error sending notifications to project ${projectId}:`, error);
      }
    }
  }

  await NotificationLog.create({
    userId: new mongoose.Types.ObjectId(userId),
    type,
    title,
    body: message,
    sentTo: sentCount,
    sentAt: new Date(),
  });

  console.log('📨 Notification sent summary:', { title, message, sentTo: sentCount });

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
        body: `Incoming A New Order: #${orderId.slice(-6)}`,
        data: { type: 'new_order', orderId },
      }));

    if (!messages.length) {
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
        userId: new mongoose.Types.ObjectId(adminId),
        type: 'new_order',
        title: '📦 New Order',
        body: `Incoming A New Order: ${orderId.slice(-6)}`,
        sentTo: sentCount,
        sentAt: new Date(),
      });
    }

    console.log('📨 Admins have been notified of new order');
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
  let tokenDocs = [];
  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    tokenDocs = await PushToken.find({ userId: objectId });

    if (!tokenDocs.length) {
      tokenDocs = await PushToken.find({ userId: userId.toString() });
    }
  } catch (err) {
    tokenDocs = await PushToken.find({ userId: userId.toString() });
  }

  if (!tokenDocs?.length || !tokenDocs[0]?.token) {
    console.log('⚠️ No token found for user, notification not sent.');
    return;
  }

  const tokens = tokenDocs
    .map((doc) => doc.token)
    .filter((token) => token && Expo.isExpoPushToken(token));

  if (!tokens.length) {
    console.warn('⚠️ No valid tokens for user:', userId);
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
    userId: new mongoose.Types.ObjectId(userId),
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
      userId: new mongoose.Types.ObjectId(adminId),
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
  console.log(`📤 Sending order status update | userId: ${userId} | orderId: ${orderId} | newStatus: ${newStatus}`);
  let title: string;
  let body: string;

  if (locale === 'he') {
    title = 'Order Status Update';
    body = `The status of your order (${orderId.slice(-6)}) has been updated to: ${newStatus}`;
  } else {
    title = 'Order Status Update';
    body = `Your order (${orderId.slice(-6)}) status changed to: ${newStatus}`;
  }

  try {
    await sendNotificationToUser(userId, {
      title,
      body,
      type: 'order_status_change' as NotificationType,
    });
  } catch (error) {
    console.error('❌ Failed to send order status notification:', error);
  }
}
// Handle order status notification via API


export const handleOrderStatusNotification = async (req: Request, res: Response): Promise<void> => {
  const { userId, orderId, newStatus, locale = 'he' } = req.body;

  if (!userId || !orderId || !newStatus) {
    res.status(400).json({ error: 'Missing required fields: userId, orderId, or newStatus' });
    return;
  }

  try {
    await sendOrderStatusChangeNotification({ userId, orderId, newStatus, locale });
    res.json({ ok: true });
  } catch (error) {
    console.error('❌ Error in handleOrderStatusNotification:', error);
    res.status(500).json({ error: 'Failed to send order status notification' });
  }
};

export const getUserNotificationHistory = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  console.log('📥 Notification history requested by user:', userId);

  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }

  try {
    const history = await NotificationLog.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ sentAt: -1 })
      .limit(50); 
    res.json(history);
  } catch (error) {
    console.error('❌ Failed to get notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
};
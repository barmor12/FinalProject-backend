import { Expo } from 'expo-server-sdk';
import { PushToken } from '../models/PushToken';
import { NotificationLog, NotificationType } from '../models/NotificationLog';

const expo = new Expo();

/**
 * Send a push notification to a user when their order status changes.
 * @param params Object containing userId, orderId, newStatus.
 */
export async function sendOrderStatusChangeNotification(params: {
  userId: string;
  orderId: string;
  newStatus: string;
  locale?: 'en' | 'he';
}) {
  const { userId, orderId, newStatus, locale = 'he' } = params;
  // Find tokens for the user
  const tokens = (await PushToken.find({ userId })).map((t) => t.token);
  if (!tokens.length) {
    console.warn(`No push tokens found for user ${userId}`);
    return;
  }
  const title = locale === 'he' ? 'עדכון סטטוס הזמנה' : 'Order Status Update';
  const body =
    locale === 'he'
      ? `ההזמנה שלך בסטטוס ${newStatus}`
      : `Your order is now ${newStatus}.`;

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title,
    body,
    data: { orderId, newStatus },
  }));

  const chunks = expo.chunkPushNotifications(messages);
  let sentCount = 0;
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      sentCount += tickets.length;
    } catch (err) {
      console.error('Push send error, retrying chunk', err);
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        sentCount += tickets.length;
      } catch (err2) {
        console.error('Push send error, chunk failed twice', err2);
      }
    }
  }

  await NotificationLog.create({
    userId,
    type: 'orderStatus' as NotificationType,
    title,
    body,
    sentTo: sentCount,
    sentAt: new Date(),
  });
}


import mongoose from 'mongoose';

/**
 * Send a push notification to a specific user.
 * @param userId - The user's ID as a string.
 * @param param1 - Object containing title, body, and type.
 */
export async function sendNotificationToUser(
  userId: string,
  {
    title,
    body,
    type,
  }: { title: string; body: string; type: string }
) {
  const tokenDocs = await PushToken.find({ userId });
  if (!tokenDocs.length) {
    console.warn('⚠️ No tokens found for user', userId);
    return;
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
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      sentCount += receipts.length;
    } catch (err) {
      console.error('❌ Error sending notification:', err);
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

  console.log(`📨 Sent ${sentCount} notifications to user ${userId}`);
}
/**
 * Send a push notification to all admins.
 * @param title - The notification title.
 * @param body - The notification body.
 */
export async function sendNotificationToAdmins({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const adminTokens = await PushToken.find().populate('userId');
  const adminTokensFiltered = adminTokens.filter((doc) => {
    const user = (doc as any).userId;
    return user && user.role === 'admin';
  });

  const messages = adminTokensFiltered
    .map((doc) => doc.token)
    .filter((token) => Expo.isExpoPushToken(token))
    .map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: { type: 'adminAlert' },
    }));

  const chunks = expo.chunkPushNotifications(messages);
  let sentCount = 0;

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      sentCount += receipts.length;
    } catch (err) {
      console.error('❌ Error sending admin notification:', err);
    }
  }

  await NotificationLog.create({
    userId: null,
    type: 'adminAlert',
    title,
    body,
    sentTo: sentCount,
    sentAt: new Date(),
  });

  console.log(`📨 Sent ${sentCount} notifications to admins`);
}
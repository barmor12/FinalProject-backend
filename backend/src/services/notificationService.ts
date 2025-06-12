import { Expo } from 'expo-server-sdk';
import { Types } from 'mongoose';
import { PushToken } from '../models/PushToken';
import { NotificationLog } from '../models/NotificationLog';
import { NotificationType } from '../models/NotificationLog';

const expo = new Expo();

export async function sendOrderStatusChangeNotification(
  userId: Types.ObjectId,
  orderId: Types.ObjectId,
  newStatus: string,
  locale: 'en' | 'he' = 'he'
) {
  const tokens = (await PushToken.find({ userId })).map((t) => t.token);
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
    data: { orderId },
  }));

  const chunks = expo.chunkPushNotifications(messages);
  let sentCount = 0;
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      sentCount += tickets.length;
    } catch (err) {
      console.error('Push send error, retrying chunk', err);
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      sentCount += tickets.length;
    }
  }

  await NotificationLog.create({
    userId,
    type: 'orderStatus' as NotificationType,
    title,
    body,
    sentTo: sentCount,
  });
}

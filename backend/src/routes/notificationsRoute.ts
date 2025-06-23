import { Router } from 'express';
import authenticateMiddleware from '../common/authMiddleware';
import {
  registerPushToken,
  sendNotificationToAll,
  getRecentNotifications,
  sendNotificationToAdmins,
  sendOrderStatusChangeNotification,
} from '../controllers/notificationController';
import { sendNotificationToUser } from '../controllers/notificationController';

export const notificationsRouter = Router();

notificationsRouter.post('/register', authenticateMiddleware, registerPushToken);
notificationsRouter.post('/send', authenticateMiddleware, sendNotificationToAll);
notificationsRouter.get('/recent', authenticateMiddleware, getRecentNotifications);
notificationsRouter.post('/user/:userId', authenticateMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { title, body, type } = req.body;
  try {
    await sendNotificationToUser(userId, { title, body, type });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error in /user/:userId route:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});
notificationsRouter.post('/send-to-admins', authenticateMiddleware, async (req, res) => {
  const { title, body } = req.body;
  try {
    await sendNotificationToAdmins({ title, body });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    res.status(500).json({ error: 'Failed to send notification to admins' });
  }
});

// שליחת התראה על שינוי סטטוס הזמנה
notificationsRouter.post('/order-status', authenticateMiddleware, async (req, res) => {
  const { userId, orderId, newStatus, locale } = req.body;
  try {
    await sendOrderStatusChangeNotification({ userId, orderId, newStatus, locale });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error sending order status notification:', error);
    res.status(500).json({ error: 'Failed to send order status notification' });
  }
});
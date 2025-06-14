import express from 'express';
import {
  placeOrder,
  getAllOrders,
  saveDraftOrder,
  duplicateOrder,
  applyDiscountCode,
  checkDeliveryDate,
  validateOrderInput,
  updateOrderStatus,
  deleteOrder,
  getUserOrders,
  getOrderById,
  sendOrderUpdateEmailHandler,
  getOrdersByDate,
  getOrdersByMonth,
  sendInvoice,
} from '../controllers/ordersController';
import authenticateMiddleware from '../common/authMiddleware';

import upload from '../common/multerMiddleware'; // Middleware לטיפול בקבצים
import { getDecorations } from '../controllers/ordersController';
import authenticateAdminMiddleware from '../common/authAdminMiddleware';

const router = express.Router();

// הצגת כל ההזמנות

router.get('/orders', authenticateMiddleware, getAllOrders);
router.post('/create', authenticateMiddleware, placeOrder);
router.post(
  '/:orderId/send-email',
  authenticateMiddleware,
  sendOrderUpdateEmailHandler
);

// שמירת טיוטת הזמנה עם העלאת תמונה
router.post(
  '/draft',
  authenticateMiddleware,

  upload.single('image'),
  saveDraftOrder
);
router.get('/orders-by-date', authenticateMiddleware, getOrdersByDate);
router.get('/orders-by-month', authenticateMiddleware, getOrdersByMonth);

router.put('/:orderId/status', updateOrderStatus); // עדכון סטטוס
router.delete('/delete/:orderId', deleteOrder); // מחיקת הזמנה

// שכפול הזמנה
router.post('/duplicate', authenticateMiddleware, duplicateOrder);

// החלת קוד הנחה
router.post('/apply-discount', authenticateMiddleware, applyDiscountCode);

// בדיקת תאריך משלוח
router.post('/check-date', authenticateMiddleware, checkDeliveryDate);

// ולידציה של הזמנה
router.post('/validate', authenticateMiddleware, validateOrderInput);

router.get('/', authenticateMiddleware, getDecorations); // GET /decorations

router.get('/user/:userId', authenticateMiddleware, getUserOrders); // קריאה לפי `userId`

router.get('/:orderId', getOrderById); // שליפת הזמנה לפי ID
router.post('/send-invoice', sendInvoice); // שליפת הזמנה לפי ID

export default router;

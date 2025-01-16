import express from 'express';
import { placeOrder,getAllOrders } from '../controllers/ordersController';
import authenticateMiddleware from "../common/authMiddleware";
import authenticateAdminMiddleware from '../common/authAdminMiddleware';

const router = express.Router();

// רוט להזמין עוגה
router.post('/new-order',authenticateMiddleware, placeOrder);

// רוט למנהל לראות את כל ההזמנות
router.get('/orders',authenticateAdminMiddleware, getAllOrders);

export default router;

import express from 'express';
import {
    getAllOrders,
    updateOrder,
    getAllUsers,
    getUserById,
    updateUser,
    getStats,
    toggleOrderPriority
} from '../controllers/adminController';
import authAdminMiddleware from '../common/authAdminMiddleware';

const router = express.Router();

// Protected admin routes
router.use(authAdminMiddleware);

// Orders routes
router.get('/orders', getAllOrders);
router.put('/orders/:orderId', updateOrder);
router.put('/orders/:orderId/priority', toggleOrderPriority);

// Users routes
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);

// Stats route
router.get('/stats', getStats);

export default router; 
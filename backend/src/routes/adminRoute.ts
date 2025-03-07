import express from "express";
import {
    getAllOrders,
    updateOrder,
    getAllUsers,
    updateUser,
    getStats
} from "../controllers/adminController";
import authenticateAdminMiddleware from "../common/authAdminMiddleware";

const router = express.Router();
router.get("/stats", authenticateAdminMiddleware, getStats);


// נתיבים להזמנות
router.get("/orders", authenticateAdminMiddleware, getAllOrders);
router.put("/orders/:orderId", authenticateAdminMiddleware, updateOrder);

// נתיבים למשתמשים
router.get("/users", authenticateAdminMiddleware, getAllUsers);
router.put("/users/:userId", authenticateAdminMiddleware, updateUser);

export default router;

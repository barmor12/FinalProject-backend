import express from "express";
import {
  placeOrder,
  getAllOrders,
  saveDraftOrder,
  duplicateOrder,
  applyDiscountCode,
  checkDeliveryDate,
  validateOrderInput,
} from "../controllers/ordersController";
import authenticateMiddleware from "../common/authMiddleware";

import upload from "../common/multerMiddleware"; // Middleware לטיפול בקבצים
import { getDecorations } from "../controllers/ordersController";
import authenticateAdminMiddleware from "../common/authAdminMiddleware";

const router = express.Router();

// הזמנת עוגה חדשה עם העלאת תמונה
router.post(
  "/new-order",
  authenticateMiddleware,
  upload.single("image"), // Middleware לתמונה
  placeOrder
);

// הצגת כל ההזמנות

router.get("/orders", authenticateAdminMiddleware, getAllOrders);

// שמירת טיוטת הזמנה עם העלאת תמונה
router.post(
  "/draft",
  authenticateMiddleware,

  upload.single("image"),
  saveDraftOrder
);

// שכפול הזמנה
router.post("/duplicate", authenticateMiddleware, duplicateOrder);

// החלת קוד הנחה
router.post("/apply-discount", authenticateMiddleware, applyDiscountCode);

// בדיקת תאריך משלוח
router.post("/check-date", authenticateMiddleware, checkDeliveryDate);

// ולידציה של הזמנה
router.post("/validate", authenticateMiddleware, validateOrderInput);

router.get("/", authenticateMiddleware, getDecorations); // GET /decorations

export default router;

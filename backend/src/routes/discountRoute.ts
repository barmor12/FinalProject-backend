import express from "express";
import {
    createDiscountCode,
    deleteDiscountCode,
    getAllDiscountCodes,
    validateDiscountCode,
} from "../controllers/discountController";
import authenticateMiddleware from "../common/authMiddleware"; // אם יש צורך
import authenticateAdminMiddleware from "../common/authAdminMiddleware";

const router = express.Router();

// יצירת קוד חדש (Admin only)
router.post("/", authenticateMiddleware, authenticateAdminMiddleware, createDiscountCode);

// שליפת כל הקודים
router.get("/", authenticateMiddleware, authenticateAdminMiddleware, getAllDiscountCodes);

// אימות קוד לפי פרמטר
router.post("/validate", validateDiscountCode);

router.delete("/:id", authenticateMiddleware, authenticateAdminMiddleware, deleteDiscountCode);


export default router;

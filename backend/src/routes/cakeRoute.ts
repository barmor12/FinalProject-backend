import express from "express";
import { addCake, updateCake, getAllCakes, deleteCake, addToFavorites, removeFromFavorites } from "../controllers/cakeController";

import multer from "multer";
import path from "path";
import authenticateAdminMiddleware from "../common/authAdminMiddleware";
import authenticateMiddleware from "../common/authMiddleware";
import { deleteProduct } from "src/controllers/inventoryController";

const router = express.Router();


// רוטים לניהול עוגות
router.post(
  "/addcake",
  authenticateMiddleware,
  addCake
);
router.put(
  "/:id",
  authenticateMiddleware,
  updateCake
);
router.get("/", getAllCakes);

// הוספת עוגה למועדפים
router.post("/favorites", authenticateMiddleware, addToFavorites);

// הסרת עוגה מהמועדפים
router.delete("/favorites", authenticateMiddleware, removeFromFavorites);

router.delete("/:id", authenticateMiddleware, deleteCake);

export default router;

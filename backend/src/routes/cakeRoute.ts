import express from "express";
import { addCake, updateCake, getAllCakes, deleteCake, addToFavorites, removeFromFavorites } from "../controllers/cakeController";

import multer from "multer";
import path from "path";
import authenticateAdminMiddleware from "../common/authAdminMiddleware";
import authenticateMiddleware from "../common/authMiddleware";

const router = express.Router();

// הגדרת המיקום בו נשמור את התמונות
const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
});

// רוטים לניהול עוגות
router.post(
  "/addcake",
  authenticateMiddleware,
  upload.single("image"),
  addCake
);
router.put(
  "/:id",
  authenticateMiddleware,
  upload.single("image"),
  updateCake
);
router.get("/", getAllCakes);
router.delete("/:id", authenticateMiddleware, deleteCake);

// הוספת עוגה למועדפים
router.post("/favorites", authenticateMiddleware, addToFavorites);

// הסרת עוגה מהמועדפים
router.delete("/favorites", authenticateMiddleware, removeFromFavorites);

export default router;

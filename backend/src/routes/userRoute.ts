import express from "express";
import {
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController";
import authenticateMiddleware from "../common/authMiddleware";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// קבלת פרטי משתמש מחובר
router.get("/profile", authenticateMiddleware, getUserProfile);

// עדכון פרטי משתמש
router.put(
  "/profile",
  authenticateMiddleware,
  upload.single("profilePic"),
  updateUserProfile
);

export default router;

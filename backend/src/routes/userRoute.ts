import express from "express";
import { deleteProfile, getProfile, updateUserName, updateUserProfilePic } from "../controllers/userController";
import authenticateMiddleware from "../common/authMiddleware";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// קבלת פרטי משתמש מחובר
router.get("/profile", authenticateMiddleware, getProfile);
router.post("/delete-profile", authenticateMiddleware, deleteProfile);

// עדכון פרטי משתמש
router.put('/updateNameProfile', authenticateMiddleware, updateUserName);
router.put('/update-profile-pic', authenticateMiddleware, upload.single('profilePic'), updateUserProfilePic);

export default router;

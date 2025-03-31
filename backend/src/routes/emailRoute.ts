import express from "express";
import authenticateAdminMiddleware from "../common/authAdminMiddleware";
import { deleteUserWithEmail, sendEmailToUser } from "../controllers/emailController";

const router = express.Router();

router.post("/:userId/message", authenticateAdminMiddleware, sendEmailToUser);
router.delete("delete/:id", authenticateAdminMiddleware, deleteUserWithEmail);

export default router;

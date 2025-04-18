import express from "express";
import { getStatistics } from "../controllers/statisticsController";
import authenticateAdminMiddleware from "../common/authAdminMiddleware";


const router = express.Router();

// Protected route - only accessible by admin
router.get("/", authenticateAdminMiddleware, getStatistics);

export default router; 
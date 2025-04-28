import express from "express";
import { getStatistics, generateFinancialReport } from "../controllers/statisticsController";
import authenticateAdminMiddleware from "../common/authAdminMiddleware";


const router = express.Router();

// Protected route - only accessible by admin
router.get("/", authenticateAdminMiddleware, getStatistics);
router.post('/financial-report', authenticateAdminMiddleware, generateFinancialReport);

export default router; 
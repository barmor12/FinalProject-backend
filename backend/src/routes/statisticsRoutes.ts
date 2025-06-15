import express from 'express';
import { getStatistics, generateFinancialReport } from '../controllers/statisticsController';
import authenticateAdminMiddleware from '../common/authAdminMiddleware';
import { getTopCakeName } from '../controllers/statisticsController';

const router = express.Router();

// Protected route - only accessible by admin
router.get('/', authenticateAdminMiddleware, getStatistics);
router.post('/financial-report', authenticateAdminMiddleware, generateFinancialReport);
router.get('/top-cake', authenticateAdminMiddleware, getTopCakeName);
export default router; 
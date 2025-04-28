import express from 'express';
import { updateExpense, createExpense, getAllExpenses, deleteExpense } from '../controllers/expenseController';
import authenticateAdminMiddleware from '../common/authAdminMiddleware';
const router = express.Router();

router.post('/', authenticateAdminMiddleware, createExpense);
router.get('/', authenticateAdminMiddleware, getAllExpenses);
router.delete('/:id', authenticateAdminMiddleware, deleteExpense);
router.put('/:id', authenticateAdminMiddleware, updateExpense);
export default router;

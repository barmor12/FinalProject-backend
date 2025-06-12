import express from 'express';
import multer from 'multer';
import { addCake, updateStock, updateCake, getAllCakes, deleteCake, addToFavorites, removeFromFavorites, getFavorites } from '../controllers/cakeController';
import authenticateMiddleware from '../common/authMiddleware';

const router = express.Router();

// הגדרת multer להעלאת תמונות
const upload = multer({ dest: 'uploads/' });

// רוטים לניהול עוגות
router.post(
  '/addcake',
  upload.single('image'), // ← הוספת multer כאן
  addCake
);

router.put(
  '/:id',
  authenticateMiddleware,
  upload.single('image'), // ← הוספת multer כאן לעדכון תמונה
  updateCake
);

router.get('/', getAllCakes);

// הוספת עוגה למועדפים
router.post('/favorites', authenticateMiddleware, addToFavorites);
router.get('/favorites/:userId', getFavorites);

// הסרת עוגה מהמועדפים
router.delete('/favorites', authenticateMiddleware, removeFromFavorites);

router.delete('/:id', authenticateMiddleware, deleteCake);
router.put('/cakes/:id/update-stock', updateStock);

export default router;

import express from 'express';
import passport from 'passport';
import {
  register,
  login,
  logout,
  verifyEmail,
  updatePassword,
  refresh,
  forgotPassword,
  resetPassword,
  upload,
  googleCallback,
  enable2FA,
  disable2FA,
  verify2FACode,
  get2FAStatus,
  addCreditCard,
  getCreditCards,
  setDefaultCard,
  deleteCreditCard,
} from '../controllers/authController';
import authenticateMiddleware from '../common/authMiddleware';

const router = express.Router();

router.post('/register', upload.single('profileImage'), register);
router.put('/update-password', updatePassword);
router.post('/login', login);
router.post('/logout', authenticateMiddleware, logout);
router.get('/verify-email', async (req, res, next) => {
  try {
    await verifyEmail(req, res);
  } catch (error) {
    console.error('[ERROR] Email verification failed:', error);
    next(error); // מעביר את השגיאה ל-Middleware לניהול שגיאות
  }
});
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/')
);

router.post('/google/callback', async (req, res, next) => {
  try {
    await googleCallback(req, res);
  } catch (error) {
    console.error('[ERROR] Google callback failed:', error);
    next(error);
  }
});
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refresh);

// 2FA routes
router.post('/2fa/enable', enable2FA);
router.post('/2fa/disable', disable2FA);
router.post('/2fa/verify', verify2FACode);
router.get('/2fa/status', get2FAStatus);

// Credit card routes
router.post('/add-credit-cards', authenticateMiddleware, addCreditCard);
router.get('/credit-cards', authenticateMiddleware, getCreditCards);
router.put('/credit-cards/:cardId/default', authenticateMiddleware, setDefaultCard);
router.delete('/delete-credit-cards/:cardId', authenticateMiddleware, deleteCreditCard);

export default router;

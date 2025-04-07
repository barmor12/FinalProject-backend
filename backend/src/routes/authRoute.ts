import express from "express";
import passport from "passport";
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
} from "../controllers/authController";

const router = express.Router();

router.post('/register', upload.single('profileImage'), register);
router.put("/update-password", updatePassword);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify-email", async (req, res, next) => {
  try {
    await verifyEmail(req, res);
  } catch (error) {
    console.error("[ERROR] Email verification failed:", error);
    next(error); // מעביר את השגיאה ל-Middleware לניהול שגיאות
  }
});
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => res.redirect("/")
);

router.post("/google/callback", async (req, res, next) => {
  try {
    await googleCallback(req, res);
  } catch (error) {
    console.error("[ERROR] Google callback failed:", error);
    next(error);
  }
});
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);

export default router;

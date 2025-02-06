import express from "express";
import passport from "passport";
import {
  register,
  login,
  logout,
  verifyEmail,
  updatePassword,
  refresh,
} from "../controllers/authController";
import { forgotPassword, resetPassword } from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.put("/update-password", updatePassword);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify-email", (req, res, next) => {
  verifyEmail(req, res).catch(next);
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
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);
export default router;

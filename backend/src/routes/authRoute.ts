import express from "express";
import passport from "passport";
import {
  register,
  login,
  logout,
  verifyEmail,
  updatePassword,
} from "../controllers/authController";

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

export default router;

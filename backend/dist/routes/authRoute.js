"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const authController_2 = require("../controllers/authController");
const router = express_1.default.Router();
router.post("/register", authController_1.register);
router.put("/update-password", authController_1.updatePassword);
router.post("/login", authController_1.login);
router.post("/logout", authController_1.logout);
router.get("/verify-email", (req, res, next) => {
    (0, authController_1.verifyEmail)(req, res).catch(next);
});
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/login" }), (req, res) => res.redirect("/"));
router.post("/forgot-password", authController_2.forgotPassword);
router.post("/reset-password", authController_2.resetPassword);
exports.default = router;
//# sourceMappingURL=authRoute.js.map
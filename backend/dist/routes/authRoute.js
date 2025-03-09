"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
router.post("/register", authController_1.register);
router.put("/update-password", authController_1.updatePassword);
router.post("/login", authController_1.login);
router.post("/logout", authController_1.logout);
router.get("/verify-email", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, authController_1.verifyEmail)(req, res);
    }
    catch (error) {
        console.error("[ERROR] Email verification failed:", error);
        next(error);
    }
}));
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/login" }), (req, res) => res.redirect("/"));
router.post("/forgot-password", authController_1.forgotPassword);
router.post("/reset-password", authController_1.resetPassword);
router.post("/refresh", authController_1.refresh);
router.post("/upload-profile-pic", authController_1.upload.single("profilePic"), authController_1.uploadProfilePic);
exports.default = router;
//# sourceMappingURL=authRoute.js.map
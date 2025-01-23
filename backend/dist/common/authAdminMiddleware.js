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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authController_1 = require("../controllers/authController");
const userModel_1 = __importDefault(require("../models/userModel"));
const authenticateAdminMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = (0, authController_1.getTokenFromRequest)(req);
        if (!token) {
            return (0, authController_1.sendError)(res, "Token is required for authentication", 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded || !decoded._id) {
            return (0, authController_1.sendError)(res, "Invalid token data", 403);
        }
        const user = yield userModel_1.default.findById(decoded._id);
        if (!user) {
            return (0, authController_1.sendError)(res, "User not found", 404);
        }
        if (user.role !== "admin") {
            return (0, authController_1.sendError)(res, "Access denied, admin privileges required", 403);
        }
        req.body.userId = user._id;
        console.log(`[INFO] Admin authentication successful for user ID: ${user._id}`);
        next();
    }
    catch (err) {
        if (err.name === "TokenExpiredError") {
            console.error(`[ERROR] Token expired: ${err.message}`);
            return (0, authController_1.sendError)(res, "Token has expired", 401);
        }
        else if (err.name === "JsonWebTokenError") {
            console.error(`[ERROR] Invalid token: ${err.message}`);
            return (0, authController_1.sendError)(res, "Invalid token", 403);
        }
        else {
            console.error(`[ERROR] Authentication error: ${err.message}`);
            return (0, authController_1.sendError)(res, "Authentication failed", 500);
        }
    }
});
exports.default = authenticateAdminMiddleware;
//# sourceMappingURL=authAdminMiddleware.js.map
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
function isTokenPayload(payload) {
    return payload && typeof payload === "object" && "userId" in payload;
}
const authenticateMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.ACCESS_TOKEN_SECRET) {
            console.error("[ERROR] ACCESS_TOKEN_SECRET is not defined in environment variables.");
            throw new Error("Missing ACCESS_TOKEN_SECRET in environment variables");
        }
        const token = (0, authController_1.getTokenFromRequest)(req);
        console.log("[INFO] Authorization Header:", req.headers.authorization);
        console.log("[INFO] Extracted Token:", token);
        if (!token) {
            console.error("[ERROR] Token is missing from the request");
            return (0, authController_1.sendError)(res, "Authorization token is required", 401);
        }
        console.log("[INFO] Decoding token...");
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("[INFO] Decoded Token:", decoded);
        if (!isTokenPayload(decoded)) {
            console.error("[ERROR] Invalid token payload structure:", decoded);
            return (0, authController_1.sendError)(res, "Invalid token data", 403);
        }
        req.body.userId = decoded.userId;
        console.log("[INFO] Authenticated user ID:", decoded.userId);
        if (decoded.role) {
            console.log("[INFO] User role:", decoded.role);
        }
        next();
    }
    catch (err) {
        console.error("[ERROR] Error verifying token:", err.message);
        if (err.name === "TokenExpiredError") {
            return (0, authController_1.sendError)(res, "Token has expired", 401);
        }
        else if (err.name === "JsonWebTokenError") {
            return (0, authController_1.sendError)(res, "Invalid token", 403);
        }
        return (0, authController_1.sendError)(res, "Authentication failed", 500);
    }
});
exports.default = authenticateMiddleware;
//# sourceMappingURL=authMiddleware.js.map
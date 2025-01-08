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
const authController_1 = __importDefault(require("../controllers/authController"));
const authController_2 = require("../controllers/authController");
function isTokenPayload(payload) {
    return payload && typeof payload === "object" && "_id" in payload;
}
const authenticateMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_2.getTokenFromRequest)(req);
    if (!token) {
        return authController_1.default.sendError(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!isTokenPayload(decoded)) {
            return authController_1.default.sendError(res, "Invalid token data", 403);
        }
        req.body.userId = decoded._id;
        console.log("Authenticated user ID: " + decoded._id);
        next();
    }
    catch (err) {
        if (err.name === "TokenExpiredError") {
            return authController_1.default.sendError(res, "Token expired", 401);
        }
        console.error("Authentication error:", err);
        return authController_1.default.sendError(res, "Invalid token", 403);
    }
});
exports.default = authenticateMiddleware;
//# sourceMappingURL=authMiddleware.js.map
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
exports.logout = exports.refresh = exports.login = exports.register = exports.sendError = exports.getTokenFromRequest = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const userModel_1 = __importDefault(require("../models/userModel"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uploadsDir = path_1.default.join(__dirname, "..", "uploads");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage: storage });
const getTokenFromRequest = (req) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
        return null;
    return authHeader.split(" ")[1];
};
exports.getTokenFromRequest = getTokenFromRequest;
const generateTokens = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = jsonwebtoken_1.default.sign({ _id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.JWT_TOKEN_EXPIRATION || '1h' });
    const refreshToken = jsonwebtoken_1.default.sign({ _id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d' });
    return { accessToken, refreshToken };
});
const sendError = (res, message, statusCode = 400) => {
    if (!res.headersSent) {
        res.status(statusCode).json({ error: message });
    }
};
exports.sendError = sendError;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, password } = req.body;
    let profilePic = "";
    if (req.file) {
        profilePic = `/uploads/${req.file.filename}`;
    }
    if (!firstName || !lastName || !email || !password) {
        return (0, exports.sendError)(res, "All fields are required");
    }
    try {
        const existingUser = yield userModel_1.default.findOne({ email });
        if (existingUser) {
            return (0, exports.sendError)(res, "User with this email already exists");
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = new userModel_1.default({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            profilePic,
            role: "user"
        });
        const newUser = yield user.save();
        const tokens = yield generateTokens(newUser._id.toString());
        res.status(201).json({ message: "User created successfully", user: newUser, tokens });
    }
    catch (err) {
        console.error("Registration error:", err);
        (0, exports.sendError)(res, "Failed to register", 500);
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return (0, exports.sendError)(res, "Email and password are required");
    }
    try {
        const user = yield userModel_1.default.findOne({ email });
        if (!user || !(yield bcryptjs_1.default.compare(password, user.password))) {
            return (0, exports.sendError)(res, "Invalid email or password");
        }
        const tokens = yield generateTokens(user._id.toString());
        user.refresh_tokens.push(tokens.refreshToken);
        yield user.save();
        res.status(200).json({
            message: "User logged in successfully",
            tokens: tokens,
        });
    }
    catch (err) {
        console.error("Login error:", err);
        (0, exports.sendError)(res, "Failed to login", 500);
    }
});
exports.login = login;
const refresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return (0, exports.sendError)(res, "Refresh token is required");
    }
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(payload._id);
        if (!user || !user.refresh_tokens.includes(refreshToken)) {
            return (0, exports.sendError)(res, "Invalid refresh token", 403);
        }
        const tokens = yield generateTokens(user._id.toString());
        user.refresh_tokens = user.refresh_tokens.filter((token) => token !== refreshToken);
        user.refresh_tokens.push(tokens.refreshToken);
        yield user.save();
        res.status(200).json(tokens);
    }
    catch (err) {
        console.error("Refresh token error:", err);
        (0, exports.sendError)(res, "Failed to refresh token", 500);
    }
});
exports.refresh = refresh;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return (0, exports.sendError)(res, "Refresh token is required");
    }
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(payload._id);
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        user.refresh_tokens = user.refresh_tokens.filter((token) => token !== refreshToken);
        yield user.save();
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (err) {
        console.error("Logout error:", err);
        (0, exports.sendError)(res, "Failed to logout", 500);
    }
});
exports.logout = logout;
exports.default = {
    register: exports.register,
    login: exports.login,
    refresh: exports.refresh,
    logout: exports.logout,
    sendError: exports.sendError,
    upload,
    getTokenFromRequest: exports.getTokenFromRequest,
};
//# sourceMappingURL=authController.js.map
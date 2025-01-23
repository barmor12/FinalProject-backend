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
exports.resetPassword = exports.logout = exports.refresh = exports.login = exports.verifyEmail = exports.register = exports.sendError = exports.getTokenFromRequest = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const userModel_1 = __importDefault(require("../models/userModel"));
const logger_1 = __importDefault(require("../logger"));
dotenv_1.default.config();
console.log(process.env.ACCESS_TOKEN_SECRET);
console.log(process.env.REFRESH_TOKEN_SECRET);
const enforceHttps = (req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
        return res.status(403).send("Please use HTTPS for secure connections.");
    }
    next();
};
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
    const accessToken = jsonwebtoken_1.default.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h" });
    const refreshToken = jsonwebtoken_1.default.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || "7d" });
    return { accessToken, refreshToken };
});
const generateVerificationToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.EMAIL_SECRET, { expiresIn: "1d" });
};
const sendVerificationEmail = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify your email address",
        html: `
      <h1>Email Verification</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `,
    };
    yield transporter.sendMail(mailOptions);
});
const sendError = (res, message, statusCode = 400) => {
    if (!res.headersSent) {
        res.status(statusCode).json({ error: message });
    }
};
exports.sendError = sendError;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, password } = req.body;
    let profilePic = req.file ? `/uploads/${req.file.filename}` : "";
    if (!firstName || !lastName || !email || !password) {
        logger_1.default.warn("Registration failed: Missing fields");
        return (0, exports.sendError)(res, "All fields are required");
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return (0, exports.sendError)(res, "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.");
    }
    try {
        const existingUser = yield userModel_1.default.findOne({ email });
        if (existingUser) {
            logger_1.default.warn(`Registration failed: Email ${email} already exists`);
            return (0, exports.sendError)(res, "User with this email already exists");
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = new userModel_1.default({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            profilePic,
            role: "user",
            isVerified: false,
        });
        const newUser = yield user.save();
        const verificationToken = generateVerificationToken(newUser._id.toString());
        yield sendVerificationEmail(email, verificationToken);
        logger_1.default.info(`User registered successfully: ${newUser.email}`);
        res.status(201).json({
            message: "User created successfully. Please verify your email.",
        });
    }
    catch (err) {
        logger_1.default.error("Registration error:", err);
        (0, exports.sendError)(res, "Failed to register", 500);
    }
});
exports.register = register;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.query;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.EMAIL_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            logger_1.default.warn("Invalid token: User not found");
            res.status(400).json({ error: "Invalid or expired token" });
            return;
        }
        if (user.isVerified) {
            logger_1.default.info(`Email already verified for user: ${user.email}`);
            res.status(200).json({ message: "Email already verified" });
            return;
        }
        user.isVerified = true;
        yield user.save();
        logger_1.default.info(`Email verified successfully for user: ${user.email}`);
        res.status(200).json({ message: "Email verified successfully" });
    }
    catch (err) {
        logger_1.default.error("Email verification error:", err);
        res.status(400).json({ error: "Invalid or expired token" });
    }
});
exports.verifyEmail = verifyEmail;
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
        if (!user.isVerified) {
            return (0, exports.sendError)(res, "Email not verified. Please check your inbox.");
        }
        const tokens = yield generateTokens(user._id.toString());
        user.refresh_tokens.push(tokens.refreshToken);
        yield user.save();
        res.status(200).json({
            message: "User logged in successfully",
            tokens,
        });
    }
    catch (err) {
        logger_1.default.error("Login error:", err);
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
        const user = yield userModel_1.default.findById(payload.userId);
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
        logger_1.default.error("Refresh token error:", err);
        (0, exports.sendError)(res, "Failed to refresh token", 500);
    }
});
exports.refresh = refresh;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        logger_1.default.warn("No refresh token provided");
        return (0, exports.sendError)(res, "Refresh token is required", 400);
    }
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(payload.userId);
        if (!user) {
            logger_1.default.warn("User not found for given refresh token");
            return (0, exports.sendError)(res, "User not found", 404);
        }
        const tokenIndex = user.refresh_tokens.indexOf(refreshToken);
        if (tokenIndex === -1) {
            logger_1.default.warn("Refresh token not found in user's tokens");
            return (0, exports.sendError)(res, "Invalid refresh token", 400);
        }
        user.refresh_tokens.splice(tokenIndex, 1);
        yield user.save();
        logger_1.default.info(`User ${user.email} logged out successfully.`);
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.name === "JsonWebTokenError") {
                logger_1.default.warn("Invalid JWT:", err.message);
                return (0, exports.sendError)(res, "Invalid refresh token", 400);
            }
            if (err.name === "TokenExpiredError") {
                logger_1.default.warn("Expired JWT:", err.message);
                return (0, exports.sendError)(res, "Refresh token expired", 401);
            }
        }
        logger_1.default.error("Logout error:", err);
        (0, exports.sendError)(res, "Failed to logout", 500);
    }
});
exports.logout = logout;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return (0, exports.sendError)(res, "Email and new password are required");
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return (0, exports.sendError)(res, "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.");
    }
    try {
        const user = yield userModel_1.default.findOne({ email });
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Password reset timeout")), 10000);
        });
        yield Promise.race([
            (() => __awaiter(void 0, void 0, void 0, function* () {
                user.password = hashedPassword;
                yield user.save();
            }))(),
            timeoutPromise,
        ]);
        res.status(200).json({ message: "Password reset successfully" });
    }
    catch (err) {
        logger_1.default.error("Password reset error:", err);
        (0, exports.sendError)(res, "Failed to reset password", 500);
    }
});
exports.resetPassword = resetPassword;
exports.default = {
    enforceHttps,
    register: exports.register,
    login: exports.login,
    refresh: exports.refresh,
    logout: exports.logout,
    resetPassword: exports.resetPassword,
    sendError: exports.sendError,
    upload,
    getTokenFromRequest: exports.getTokenFromRequest,
    verifyEmail: exports.verifyEmail,
};
//# sourceMappingURL=authController.js.map
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
exports.verifyEmail = exports.logout = exports.refresh = exports.login = exports.register = exports.sendError = exports.sendVerificationEmail = exports.getTokenFromRequest = exports.upload = exports.enforceHttps = void 0;
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
const enforceHttps = (req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
        logger_1.default.warn("[WARN] Request not using HTTPS");
        return res.status(403).send("Please use HTTPS for secure connections.");
    }
    next();
};
exports.enforceHttps = enforceHttps;
const uploadsDir = path_1.default.join(__dirname, "..", "uploads");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
exports.upload = (0, multer_1.default)({ storage });
const getTokenFromRequest = (req) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        logger_1.default.warn("[WARN] Authorization header missing");
        return null;
    }
    return authHeader.split(" ")[1];
};
exports.getTokenFromRequest = getTokenFromRequest;
const generateTokens = (userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
        throw new Error("Token secrets are not configured in .env file");
    }
    logger_1.default.info(`[INFO] Generating tokens for userId: ${userId}, role: ${role}`);
    const accessToken = jsonwebtoken_1.default.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h",
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || "7d",
    });
    logger_1.default.info(`[INFO] Tokens generated successfully for userId: ${userId}`);
    return { accessToken, refreshToken };
});
const generateVerificationToken = (userId) => {
    logger_1.default.info(`[INFO] Generating email verification token for userId: ${userId}`);
    return jsonwebtoken_1.default.sign({ userId }, process.env.EMAIL_SECRET, { expiresIn: "1d" });
};
const sendVerificationEmail = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error("Email credentials are not configured");
    }
    logger_1.default.info(`[INFO] Sending email verification to: ${email}`);
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
    logger_1.default.info(`[INFO] Verification email sent to: ${email}`);
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendError = (res, message, statusCode = 400) => {
    logger_1.default.error(`[ERROR] ${message} (Status: ${statusCode})`);
    if (!res.headersSent) {
        res.status(statusCode).json({ error: message });
    }
};
exports.sendError = sendError;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, password } = req.body;
    const profilePic = req.file ? `/uploads/${req.file.filename}` : "";
    logger_1.default.info(`[INFO] Attempting to register user: ${email}`);
    if (!firstName || !lastName || !email || !password) {
        logger_1.default.warn("[WARN] Registration failed: Missing fields");
        return (0, exports.sendError)(res, "All fields are required");
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return (0, exports.sendError)(res, "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.");
    }
    try {
        const existingUser = yield userModel_1.default.findOne({ email });
        if (existingUser) {
            logger_1.default.warn(`[WARN] Registration failed: Email ${email} already exists`);
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
        yield (0, exports.sendVerificationEmail)(email, verificationToken);
        logger_1.default.info(`[INFO] User registered successfully: ${email}`);
        res.status(201).json({
            message: "User created successfully. Please verify your email.",
        });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Registration error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to register", 500);
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    logger_1.default.info(`[INFO] Login attempt for email: ${email}`);
    if (!email || !password) {
        return (0, exports.sendError)(res, "Email and password are required");
    }
    try {
        const user = yield userModel_1.default.findOne({ email });
        logger_1.default.info(`[INFO] User fetched during login: ${user}`);
        if (!user || !(yield bcryptjs_1.default.compare(password, user.password))) {
            return (0, exports.sendError)(res, "Invalid email or password");
        }
        if (!user.isVerified) {
            return (0, exports.sendError)(res, "Email not verified. Please check your inbox.");
        }
        const tokens = yield generateTokens(user._id.toString(), user.role);
        logger_1.default.info(`[INFO] Generated tokens for user: ${email}`);
        user.refresh_tokens.push(tokens.refreshToken);
        yield user.save();
        res.status(200).json({
            message: "User logged in successfully",
            tokens,
        });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Login error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to login", 500);
    }
});
exports.login = login;
const refresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    logger_1.default.info("[INFO] Refresh token process started");
    if (!refreshToken) {
        return (0, exports.sendError)(res, "Refresh token is required");
    }
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        logger_1.default.info(`[INFO] Refresh token verified for userId: ${payload.userId}`);
        const user = yield userModel_1.default.findById(payload.userId);
        if (!user || !user.refresh_tokens.includes(refreshToken)) {
            return (0, exports.sendError)(res, "Invalid refresh token", 403);
        }
        const tokens = yield generateTokens(user._id.toString(), user.role);
        user.refresh_tokens = user.refresh_tokens.filter((token) => token !== refreshToken);
        user.refresh_tokens.push(tokens.refreshToken);
        yield user.save();
        logger_1.default.info(`[INFO] Refresh token process completed for userId: ${user._id}`);
        res.status(200).json(tokens);
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Refresh token error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to refresh token", 500);
    }
});
exports.refresh = refresh;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    logger_1.default.info("[INFO] Logout process started");
    if (!refreshToken) {
        return (0, exports.sendError)(res, "Refresh token is required");
    }
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(payload.userId);
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        user.refresh_tokens = user.refresh_tokens.filter((token) => token !== refreshToken);
        yield user.save();
        logger_1.default.info(`[INFO] User logged out: ${user._id}`);
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Logout error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to logout", 500);
    }
});
exports.logout = logout;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.query;
    logger_1.default.info("[INFO] Email verification process started");
    if (!token) {
        return (0, exports.sendError)(res, "Token is required", 400);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.EMAIL_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        if (user.isVerified) {
            logger_1.default.info(`[INFO] Email already verified for user: ${user.email}`);
            return res.status(200).json({ message: "Email already verified" });
        }
        user.isVerified = true;
        yield user.save();
        logger_1.default.info(`[INFO] Email verification successful for user: ${user.email}`);
        res.status(200).json({ message: "Email verified successfully" });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Email verification error: ${err.message}`);
        (0, exports.sendError)(res, "Invalid or expired token", 400);
    }
});
exports.verifyEmail = verifyEmail;
exports.default = {
    enforceHttps: exports.enforceHttps,
    register: exports.register,
    login: exports.login,
    refresh: exports.refresh,
    logout: exports.logout,
    sendError: exports.sendError,
    upload: exports.upload,
    getTokenFromRequest: exports.getTokenFromRequest,
    verifyEmail: exports.verifyEmail,
};
//# sourceMappingURL=authController.js.map
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
exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.logout = exports.refresh = exports.get2FAStatus = exports.login = exports.disable2FA = exports.verify2FACode = exports.enable2FA = exports.register = exports.updatePassword = exports.sendError = exports.sendVerificationEmail = exports.getTokenFromRequest = exports.upload = exports.enforceHttps = exports.googleCallback = void 0;
const google_auth_library_1 = require("google-auth-library");
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID_IOS);
const googleCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_token, password } = req.body;
    try {
        const ticket = yield client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID_IOS,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return res
                .status(400)
                .json({ error: "Failed to get payload from token" });
        }
        let user = yield userModel_1.default.findOne({ googleId: payload.sub });
        if (!user) {
            user = yield userModel_1.default.findOne({ email: payload.email });
            if (user) {
                user.googleId = payload.sub;
                yield user.save();
            }
            else {
                const hashedPassword = yield bcryptjs_1.default.hash(password || payload.sub + "google", 10);
                user = new userModel_1.default({
                    googleId: payload.sub,
                    email: payload.email,
                    nickname: payload.name,
                    firstName: payload.given_name || "Google",
                    lastName: payload.family_name || "User",
                    profilePic: payload.picture,
                    password: hashedPassword,
                    role: "user",
                    isVerified: true,
                });
                yield user.save();
            }
        }
        else if (!user.password) {
            const hashedPassword = yield bcryptjs_1.default.hash(password || payload.sub + "google", 10);
            user.password = hashedPassword;
            yield user.save();
        }
        const tokens = yield generateTokens(user._id.toString(), user.role);
        user.refresh_tokens.push(tokens.refreshToken);
        yield user.save();
        res.status(200).json({
            message: "User logged in successfully via Google",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            role: user.role,
            userId: user._id.toString(),
        });
    }
    catch (error) {
        console.error("Error verifying token:", error);
        res.status(500).json({ error: "Failed to authenticate user" });
    }
});
exports.googleCallback = googleCallback;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const userModel_1 = __importDefault(require("../models/userModel"));
const logger_1 = __importDefault(require("../logger"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
dotenv_1.default.config();
const enforceHttps = (req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
        logger_1.default.warn("[WARN] Request not using HTTPS");
        return res.status(403).send("Please use HTTPS for secure connections.");
    }
    next();
};
exports.enforceHttps = enforceHttps;
const storage = multer_1.default.memoryStorage();
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
    return { accessToken, refreshToken };
});
const generateVerificationToken = (userId) => {
    if (!process.env.EMAIL_SECRET) {
        throw new Error("EMAIL_SECRET is missing in .env file");
    }
    return jsonwebtoken_1.default.sign({ userId }, process.env.EMAIL_SECRET, { expiresIn: "1d" });
};
const sendVerificationEmail = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error("Email credentials are missing in .env file");
        }
        const transporter = nodemailer_1.default.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            secure: true,
        });
        const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
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
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Failed to send verification email: ${error.message}`);
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendError = (res, message, statusCode = 400) => {
    logger_1.default.error(`[ERROR] ${message} (Status: ${statusCode})`);
    if (!res.headersSent) {
        res.status(statusCode).json({ error: message });
    }
};
exports.sendError = sendError;
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, exports.getTokenFromRequest)(req);
    if (!token) {
        return (0, exports.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return (0, exports.sendError)(res, "Both old and new passwords are required", 400);
        }
        const isMatch = yield bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isMatch) {
            return (0, exports.sendError)(res, "Old password is incorrect", 400);
        }
        user.password = yield bcryptjs_1.default.hash(newPassword, 10);
        yield user.save();
        res.status(200).json({
            message: "Password updated successfully",
        });
    }
    catch (err) {
        console.error("Update password error:", err);
        return (0, exports.sendError)(res, "Failed to update password", 500);
    }
});
exports.updatePassword = updatePassword;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, password } = req.body;
    logger_1.default.info(`[INFO] Attempting to register user: ${email}`);
    if (!firstName || !lastName || !email || !password) {
        logger_1.default.warn("[WARN] Registration failed: Missing fields");
        return (0, exports.sendError)(res, "All fields are required", 400);
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return (0, exports.sendError)(res, "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.", 400);
    }
    try {
        const existingUser = yield userModel_1.default.findOne({ email });
        if (existingUser) {
            logger_1.default.warn(`[WARN] Registration failed: Email ${email} already exists`);
            return (0, exports.sendError)(res, "User with this email already exists", 409);
        }
        let profilePic = {
            url: "https://res.cloudinary.com/dhhrsuudb/image/upload/v1743463363/default_profile_image.png",
            public_id: "users/default_profile_image",
        };
        if (req.file) {
            logger_1.default.info("[INFO] Uploading profile image to Cloudinary...");
            const streamUpload = (buffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary_1.default.uploader.upload_stream({ folder: "users" }, (error, result) => {
                        if (result)
                            resolve(result);
                        else
                            reject(error);
                    });
                    const { Readable } = require("stream");
                    Readable.from(buffer).pipe(stream);
                });
            };
            try {
                const uploadResult = yield streamUpload(req.file.buffer);
                profilePic = {
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id,
                };
                logger_1.default.info("[INFO] Profile image uploaded successfully");
            }
            catch (error) {
                logger_1.default.error(`[ERROR] Cloudinary upload error: ${error.message}`);
                return (0, exports.sendError)(res, "Profile image upload failed", 500);
            }
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
            user: newUser,
        });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Registration error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to register", 500);
    }
});
exports.register = register;
const generateAndSend2FACode = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const user = yield userModel_1.default.findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }
    user.twoFactorCode = code;
    user.twoFactorExpires = expiresAt;
    yield user.save();
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error("Email credentials are missing in environment variables");
    }
    const transporter = nodemailer_1.default.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        secure: true,
    });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your 2FA Verification Code",
        html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f9;
            margin: 0;
            padding: 0;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            background-color: #5a3827;
            padding: 10px;
            border-radius: 8px;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            margin-top: 20px;
            font-size: 16px;
            color: #333333;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            color: #5a3827;
            letter-spacing: 5px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #777777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Two-Factor Authentication</h1>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            <p>Your verification code is:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>

          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    };
    yield transporter.sendMail(mailOptions);
    logger_1.default.info(`[INFO] 2FA code sent to: ${email}`);
});
const enable2FA = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, exports.getTokenFromRequest)(req);
    if (!token) {
        return (0, exports.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        yield generateAndSend2FACode(user.email);
        res.status(200).json({
            message: "Verification code sent to your email",
            requiresVerification: true,
        });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Enable 2FA error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to enable 2FA", 500);
    }
});
exports.enable2FA = enable2FA;
const verify2FACode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, exports.getTokenFromRequest)(req);
    if (!token) {
        return (0, exports.sendError)(res, "Token required", 401);
    }
    const { code } = req.body;
    if (!code) {
        return (0, exports.sendError)(res, "Verification code is required", 400);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        if (!user.twoFactorCode || !user.twoFactorExpires) {
            return (0, exports.sendError)(res, "No 2FA code found", 400);
        }
        if (user.twoFactorCode !== code) {
            return (0, exports.sendError)(res, "Invalid 2FA code", 400);
        }
        if (Date.now() > user.twoFactorExpires.getTime()) {
            return (0, exports.sendError)(res, "2FA code has expired", 400);
        }
        user.twoFactorEnabled = true;
        user.twoFactorCode = undefined;
        user.twoFactorExpires = undefined;
        yield user.save();
        res.status(200).json({
            message: "2FA enabled successfully",
            twoFactorEnabled: true,
        });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Verify 2FA code error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to verify 2FA code", 500);
    }
});
exports.verify2FACode = verify2FACode;
const disable2FA = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, exports.getTokenFromRequest)(req);
    if (!token) {
        return (0, exports.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        user.twoFactorEnabled = false;
        user.twoFactorCode = undefined;
        user.twoFactorExpires = undefined;
        yield user.save();
        res.status(200).json({ message: "2FA disabled successfully" });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Disable 2FA error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to disable 2FA", 500);
    }
});
exports.disable2FA = disable2FA;
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
            const verificationToken = generateVerificationToken(user._id.toString());
            yield (0, exports.sendVerificationEmail)(user.email, verificationToken);
            return (0, exports.sendError)(res, "Email not verified. A new verification email has been sent.");
        }
        if (user.twoFactorEnabled) {
            yield generateAndSend2FACode(email);
            const tempTokens = yield generateTokens(user._id.toString(), user.role);
            res.status(200).json({
                message: "2FA code sent to email",
                requires2FA: true,
                tokens: tempTokens,
                userId: user._id.toString(),
                role: user.role,
            });
            return;
        }
        const tokens = yield generateTokens(user._id.toString(), user.role);
        logger_1.default.info(`[INFO] Generated tokens for user: ${email}`);
        user.refresh_tokens.push(tokens.refreshToken);
        yield user.save();
        res.status(200).json({
            message: "User logged in successfully",
            tokens,
            role: user.role,
            userId: user._id.toString(),
        });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Login error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to login", 500);
    }
});
exports.login = login;
const get2FAStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, exports.getTokenFromRequest)(req);
    if (!token) {
        return (0, exports.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        res.status(200).json({
            isEnabled: user.twoFactorEnabled || false,
        });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Get 2FA status error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to get 2FA status", 500);
    }
});
exports.get2FAStatus = get2FAStatus;
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
        logger_1.default.warn("[WARN] Refresh token is missing from the request");
        return (0, exports.sendError)(res, "Refresh token is required", 400);
    }
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(payload.userId);
        if (!user) {
            logger_1.default.warn("[WARN] User not found during logout");
            return (0, exports.sendError)(res, "User not found", 404);
        }
        user.refresh_tokens = user.refresh_tokens.filter((token) => token !== refreshToken);
        yield user.save();
        logger_1.default.info(`[INFO] User logged out successfully: ${user._id}`);
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (err) {
        if (err.name === "JsonWebTokenError") {
            logger_1.default.warn("[WARN] Invalid refresh token provided");
            return (0, exports.sendError)(res, "Invalid refresh token", 403);
        }
        else if (err.name === "TokenExpiredError") {
            logger_1.default.warn("[WARN] Refresh token expired");
            return (0, exports.sendError)(res, "Refresh token expired", 401);
        }
        logger_1.default.error(`[ERROR] Logout error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to logout", 500);
    }
});
exports.logout = logout;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.query;
    if (!token || !process.env.EMAIL_SECRET) {
        return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Email Verification</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;700&display=swap');

          body {
            background: radial-gradient(circle, #ff9966, #ff5e62);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: 'Poppins', sans-serif;
            color: #fff;
            text-align: center;
          }

          .container {
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0px 15px 40px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            text-align: center;
            color: #333;
            animation: fadeIn 1s ease-in-out;
            position: relative;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .icon {
            font-size: 80px;
            margin-bottom: 20px;
          }

          .error { color: #e74c3c; }
          .success { color: #27ae60; }

          .title {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 15px;
          }

          .message {
            font-size: 20px;
            color: #555;
            margin-bottom: 20px;
          }

          .glow {
            animation: glowEffect 1.5s infinite alternate;
          }

          @keyframes glowEffect {
            from { text-shadow: 0 0 10px rgba(255, 94, 98, 0.8); }
            to { text-shadow: 0 0 20px rgba(255, 94, 98, 1); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <div class="title error glow">Verification Error</div>
          <div class="message">Please check your email and try again.</div>
        </div>
      </body>
      </html>
    `);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.EMAIL_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Email Verification</title>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <div class="title error glow">User Not Found</div>
            <div class="message">Please ensure you are registered.</div>
          </div>
        </body>
        </html>
      `);
        }
        if (user.isVerified) {
            return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Email Verified</title>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <div class="title success glow">Email Already Verified</div>
            <div class="message">Your email has already been verified.</div>
          </div>
        </body>
        </html>
      `);
        }
        user.isVerified = true;
        yield user.save();
        return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Email Verified</title>
      </head>
      <body>
        <div class="container">
          <div class="icon">🎉</div>
          <div class="title success glow">Thank You!</div>
          <div class="message">Your email has been successfully verified!</div>
        </div>
      </body>
      </html>
    `);
    }
    catch (error) {
        return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Email Verification</title>
      </head>
      <body>
        <div class="container">
          <div class="icon">⚠️</div>
          <div class="title error glow">Invalid or Expired Token</div>
          <div class="message">Please request a new verification email.</div>
        </div>
      </body>
      </html>
    `);
    }
});
exports.verifyEmail = verifyEmail;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return (0, exports.sendError)(res, "Email is required", 400);
    }
    try {
        const user = yield userModel_1.default.findOne({ email });
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        user.resetToken = resetCode;
        user.resetExpires = expiresAt;
        yield user.save();
        yield sendResetEmail(user.email, resetCode);
        res.status(200).json({ message: "Reset code sent to email" });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Forgot password error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to send reset email", 500);
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
        return (0, exports.sendError)(res, "All fields are required", 400);
    }
    try {
        const user = yield userModel_1.default.findOne({ email });
        if (!user) {
            return (0, exports.sendError)(res, "User not found", 404);
        }
        if (!user.resetToken ||
            user.resetToken !== code ||
            !user.resetExpires ||
            Date.now() > user.resetExpires.getTime()) {
            return (0, exports.sendError)(res, "Invalid or expired reset code", 400);
        }
        yield userModel_1.default.updateOne({ email }, { $unset: { resetToken: 1, resetExpires: 1 } });
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        yield user.save();
        res.status(200).json({ message: "Password reset successfully" });
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Reset password error: ${err.message}`);
        (0, exports.sendError)(res, "Failed to reset password", 500);
    }
});
exports.resetPassword = resetPassword;
const sendResetEmail = (email, resetCode) => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error("Email credentials are missing in environment variables");
    }
    const transporter = nodemailer_1.default.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Code",
        html: `
      <h1>Password Reset Request</h1>
      <p>Use the following code to reset your password:</p>
      <h2>${resetCode}</h2>
      <p>This code will expire in 15 minutes.</p>
    `,
    };
    yield transporter.sendMail(mailOptions);
    logger_1.default.info(`[INFO] Password reset email sent to: ${email}`);
});
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
    updatePassword: exports.updatePassword,
    forgotPassword: exports.forgotPassword,
    resetPassword: exports.resetPassword,
    googleCallback: exports.googleCallback,
    enable2FA: exports.enable2FA,
    disable2FA: exports.disable2FA,
    verify2FACode: exports.verify2FACode,
    get2FAStatus: exports.get2FAStatus,
};
//# sourceMappingURL=authController.js.map
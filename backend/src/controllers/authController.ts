import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import User from "../models/userModel";
import logger from "../logger";

dotenv.config();

// הגדרת מבנה הטוקן
interface TokenPayload extends JwtPayload {
  userId: string;
  role: string;
}

// Middleware לאכיפת HTTPS
export const enforceHttps = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    logger.warn("[WARN] Request not using HTTPS");
    return res.status(403).send("Please use HTTPS for secure connections.");
  }
  next();
};

// יצירת תיקייה להעלאות אם אינה קיימת
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// הגדרת Multer להעלאת קבצים
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
export const upload = multer({ storage });

// שליפת טוקן מהבקשה
export const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    logger.warn("[WARN] Authorization header missing");
    return null;
  }
  return authHeader.split(" ")[1];
};

// יצירת טוקן גישה וטוקן רענון
const generateTokens = async (userId: string, role: string) => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("Token secrets are not configured in .env file");
  }

  logger.info(`[INFO] Generating tokens for userId: ${userId}, role: ${role}`);
  const accessToken = jwt.sign(
    { userId, role },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h",
    }
  );

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || "7d",
  });

  logger.info(`[INFO] Tokens generated successfully for userId: ${userId}`);
  return { accessToken, refreshToken };
};

// יצירת טוקן לאימות דוא"ל

const generateVerificationToken = (userId: string) => {
  if (!process.env.EMAIL_SECRET) {
    throw new Error("EMAIL_SECRET is missing in .env file");
  }
  return jwt.sign({ userId }, process.env.EMAIL_SECRET, { expiresIn: "1d" });
};

// שליחת קישור לאימות דוא"ל
// שליחת קישור לאימות דוא"ל
export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error("Email credentials are missing in .env file");
    }

    const transporter = nodemailer.createTransport({
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

    await transporter.sendMail(mailOptions);
    logger.info(`[INFO] Verification email sent to: ${email}`);
  } catch (error: any) {
    logger.error(`[ERROR] Failed to send verification email: ${error.message}`);
  }
};
// שליחת שגיאה
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400
) => {
  logger.error(`[ERROR] ${message} (Status: ${statusCode})`);
  if (!res.headersSent) {
    res.status(statusCode).json({ error: message });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return sendError(res, "Token required", 401);
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return sendError(res, "Both old and new passwords are required", 400);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return sendError(res, "Old password is incorrect", 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Update password error:", err);
    return sendError(res, "Failed to update password", 500); // make sure `sendError` sends proper JSON
  }
};

// רישום משתמש חדש
export const register = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  const profilePic = req.file ? `/uploads/${req.file.filename}` : "";

  logger.info(`[INFO] Attempting to register user: ${email}`);
  if (!firstName || !lastName || !email || !password) {
    logger.warn("[WARN] Registration failed: Missing fields");
    return sendError(res, "All fields are required");
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return sendError(
      res,
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character."
    );
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`[WARN] Registration failed: Email ${email} already exists`);
      return sendError(res, "User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profilePic,
      role: "user",
      isVerified: false,
    });

    const newUser = await user.save();
    const verificationToken = generateVerificationToken(newUser._id.toString());
    await sendVerificationEmail(email, verificationToken);

    logger.info(`[INFO] User registered successfully: ${email}`);
    res.status(201).json({
      message: "User created successfully. Please verify your email.",
    });
  } catch (err) {
    logger.error(`[ERROR] Registration error: ${(err as Error).message}`);
    sendError(res, "Failed to register", 500);
  }
};

// כניסת משתמש
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  logger.info(`[INFO] Login attempt for email: ${email}`);
  if (!email || !password) {
    return sendError(res, "Email and password are required");
  }

  try {
    const user = await User.findOne({ email });
    logger.info(`[INFO] User fetched during login: ${user}`);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return sendError(res, "Invalid email or password");
    }

    if (!user.isVerified) {
      const verificationToken = generateVerificationToken(user._id.toString());
      await sendVerificationEmail(user.email, verificationToken);
      return sendError(
        res,
        "Email not verified. A new verification email has been sent."
      );
    }
    const tokens = await generateTokens(user._id.toString(), user.role);
    logger.info(`[INFO] Generated tokens for user: ${email}`);

    user.refresh_tokens.push(tokens.refreshToken);
    await user.save();

    res.status(200).json({
      message: "User logged in successfully",
      tokens,
      role: user.role,
    });
  } catch (err) {
    logger.error(`[ERROR] Login error: ${(err as Error).message}`);
    sendError(res, "Failed to login", 500);
  }
};

// רענון טוקן
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  logger.info("[INFO] Refresh token process started");

  if (!refreshToken) {
    return sendError(res, "Refresh token is required");
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as TokenPayload;

    logger.info(`[INFO] Refresh token verified for userId: ${payload.userId}`);
    const user = await User.findById(payload.userId);
    if (!user || !user.refresh_tokens.includes(refreshToken)) {
      return sendError(res, "Invalid refresh token", 403);
    }

    const tokens = await generateTokens(user._id.toString(), user.role);
    user.refresh_tokens = user.refresh_tokens.filter(
      (token) => token !== refreshToken
    );
    user.refresh_tokens.push(tokens.refreshToken);
    await user.save();

    logger.info(
      `[INFO] Refresh token process completed for userId: ${user._id}`
    );
    res.status(200).json(tokens);
  } catch (err) {
    logger.error(`[ERROR] Refresh token error: ${(err as Error).message}`);
    sendError(res, "Failed to refresh token", 500);
  }
};

// יציאת משתמש

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  logger.info("[INFO] Logout process started");

  if (!refreshToken) {
    logger.warn("[WARN] Refresh token is missing from the request");
    return sendError(res, "Refresh token is required", 400);
  }

  try {
    // Verify the refresh token
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as TokenPayload;

    // Find the user by ID
    const user = await User.findById(payload.userId);
    if (!user) {
      logger.warn("[WARN] User not found during logout");
      return sendError(res, "User not found", 404);
    }

    // Remove ALL refresh tokens for the user
    user.refresh_tokens = user.refresh_tokens.filter(
      (token) => token !== refreshToken
    );
    await user.save();

    logger.info(`[INFO] User logged out successfully: ${user._id}`);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err: any) {
    // Handle token verification errors
    if (err.name === "JsonWebTokenError") {
      logger.warn("[WARN] Invalid refresh token provided");
      return sendError(res, "Invalid refresh token", 403);
    } else if (err.name === "TokenExpiredError") {
      logger.warn("[WARN] Refresh token expired");
      return sendError(res, "Refresh token expired", 401);
    }

    // Handle other errors
    logger.error(`[ERROR] Logout error: ${err.message}`);
    sendError(res, "Failed to logout", 500);
  }
};
// אימות דוא"ל
export const verifyEmail = async (req: Request, res: Response) => {
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
    const decoded = jwt.verify(
      token as string,
      process.env.EMAIL_SECRET
    ) as TokenPayload;
    const user = await User.findById(decoded.userId);

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
    await user.save();

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
  } catch (error) {
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
};
const resetPasswordTokens = new Map<
  string,
  { code: string; expiresAt: number }
>();

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return sendError(res, "Email is required", 400);
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // יצירת קוד אימות בן 6 ספרות
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // תוקף ל-15 דקות

    // שמירת הקוד בזיכרון (אפשר להשתמש גם בבסיס נתונים)
    setTimeout(() => {
      resetPasswordTokens.delete(user.email);
    }, 15 * 60 * 1000);

    // שליחת אימייל למשתמש
    await sendResetEmail(user.email, resetCode);

    res.status(200).json({ message: "Reset code sent to email" });
  } catch (err) {
    logger.error(`[ERROR] Forgot password error: ${(err as Error).message}`);
    sendError(res, "Failed to send reset email", 500);
  }
};
export const resetPassword = async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return sendError(res, "All fields are required", 400);
  }

  try {
    // בדיקת קיום המשתמש
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // בדיקת קוד שחזור
    const storedToken = resetPasswordTokens.get(email);
    if (
      !storedToken ||
      storedToken.code !== code ||
      Date.now() > storedToken.expiresAt
    ) {
      return sendError(res, "Invalid or expired reset code", 400);
    }

    // מחיקת הטוקן מהזיכרון לאחר השימוש
    resetPasswordTokens.delete(email);

    // הצפנת הסיסמה החדשה ועדכונה במסד הנתונים
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    logger.error(`[ERROR] Reset password error: ${(err as Error).message}`);
    sendError(res, "Failed to reset password", 500);
  }
};
const sendResetEmail = async (email: string, resetCode: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error("Email credentials are missing in environment variables");
  }

  const transporter = nodemailer.createTransport({
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

  await transporter.sendMail(mailOptions);
  logger.info(`[INFO] Password reset email sent to: ${email}`);
};
export const uploadProfilePic = async (req: Request, res: Response) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return sendError(res, "Authentication required", 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }

    user.profilePic = `/uploads/${req.file.filename}`;
    await user.save();

    // שימוש בכתובת ברירת מחדל אם BASE_URL לא מוגדר
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicUrl: `${baseUrl}/uploads/${req.file.filename}`,
    });
  } catch (error) {
    console.error("[ERROR] Upload profile picture failed:", error);
    sendError(res, "Failed to upload profile picture", 500);
  }
};

export default {
  enforceHttps,
  register,
  login,
  refresh,
  logout,
  sendError,
  upload,
  getTokenFromRequest,
  verifyEmail,
  updatePassword,
  forgotPassword,
  resetPassword,
  uploadProfilePic,
};

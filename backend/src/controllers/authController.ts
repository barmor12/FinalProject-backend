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
  logger.info(
    `[INFO] Generating email verification token for userId: ${userId}`
  );
  return jwt.sign({ userId }, process.env.EMAIL_SECRET!, { expiresIn: "1d" });
};

// שליחת קישור לאימות דוא"ל
export const sendVerificationEmail = async (email: string, token: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error("Email credentials are not configured");
  }

  logger.info(`[INFO] Sending email verification to: ${email}`);
  const transporter = nodemailer.createTransport({
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

  await transporter.sendMail(mailOptions);
  logger.info(`[INFO] Verification email sent to: ${email}`);
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
    sendError(res, "Failed to update password", 500);
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
      return sendError(res, "Email not verified. Please check your inbox.");
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
    user.refresh_tokens = [];
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

  logger.info("[INFO] Email verification process started");
  if (!token) {
    return sendError(res, "Token is required", 400);
  }

  try {
    const decoded = jwt.verify(
      token as string,
      process.env.EMAIL_SECRET!
    ) as TokenPayload;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    if (user.isVerified) {
      logger.info(`[INFO] Email already verified for user: ${user.email}`);
      return res.status(200).json({ message: "Email already verified" });
    }

    user.isVerified = true;
    await user.save();

    logger.info(`[INFO] Email verification successful for user: ${user.email}`);
    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    logger.error(`[ERROR] Email verification error: ${(err as Error).message}`);
    sendError(res, "Invalid or expired token", 400);
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
};

import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import User from "../models/userModel";
import dotenv from "dotenv";
import logger from "../logger";
import nodemailer from "nodemailer";

dotenv.config();
interface TokenPayload extends JwtPayload {
  _id: string;
}

// יצירת תיקיית uploads אם לא קיימת
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

export const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  return authHeader.split(" ")[1];
};

const generateTokens = async (userId: string) => {
  const accessToken = jwt.sign(
    { _id: userId },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h" } // אם לא מוגדר, ברירת המחדל היא שעה
  );

  const refreshToken = jwt.sign(
    { _id: userId },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || "7d" } // אם לא מוגדר, ברירת המחדל היא 7 ימים
  );

  return { accessToken, refreshToken };
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400
) => {
  if (!res.headersSent) {
    res.status(statusCode).json({ error: message });
  }
};
export const register = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  let profilePic = "";

  if (req.file) {
    profilePic = `/uploads/${req.file.filename}`;
  }

  if (!firstName || !lastName || !email || !password) {
    logger.warn("Registration failed: Missing fields");
    return sendError(res, "All fields are required");
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Registration failed: Email ${email} already exists`);
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
      isVerified: false, // משתמש חדש אינו מאומת
    });

    const newUser = await user.save();

    // Generate verification token and send email
    const verificationToken = generateVerificationToken(newUser._id.toString());
    await sendVerificationEmail(email, verificationToken);

    logger.info(`User registered successfully: ${newUser.email}`);
    res.status(201).json({
      message: "User created successfully. Please verify your email.",
    });
  } catch (err) {
    logger.error("Registration error:", err);
    sendError(res, "Failed to register", 500);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, "Email and password are required");
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return sendError(res, "Invalid email or password");
    }

    const tokens = await generateTokens(user._id.toString());
    user.refresh_tokens.push(tokens.refreshToken);
    await user.save();

    res.status(200).json({
      message: "User logged in successfully", // הודעה שהמשתמש התחבר בהצלחה
      tokens: tokens, // שלח את הטוקנים
    });
  } catch (err) {
    console.error("Login error:", err);
    sendError(res, "Failed to login", 500);
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return sendError(res, "Refresh token is required");
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as TokenPayload;

    const user = await User.findById(payload._id);
    if (!user || !user.refresh_tokens.includes(refreshToken)) {
      return sendError(res, "Invalid refresh token", 403);
    }

    const tokens = await generateTokens(user._id.toString());
    user.refresh_tokens = user.refresh_tokens.filter(
      (token) => token !== refreshToken
    );
    user.refresh_tokens.push(tokens.refreshToken);
    await user.save();

    res.status(200).json(tokens);
  } catch (err) {
    console.error("Refresh token error:", err);
    sendError(res, "Failed to refresh token", 500);
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return sendError(res, "Refresh token is required");
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as TokenPayload;

    const user = await User.findById(payload._id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    user.refresh_tokens = user.refresh_tokens.filter(
      (token) => token !== refreshToken
    );
    await user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    sendError(res, "Failed to logout", 500);
  }
};

const generateVerificationToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.EMAIL_SECRET!, { expiresIn: "1d" }); // תוקף של יום
};

const sendVerificationEmail = async (email: any, token: string) => {
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
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token as string, process.env.EMAIL_SECRET!);
    const user = await User.findById((decoded as any).userId);

    if (!user) {
      logger.warn("Invalid token: User not found");
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }

    if (user.isVerified) {
      logger.info(`Email already verified for user: ${user.email}`);
      res.status(200).json({ message: "Email already verified" });
      return;
    }

    user.isVerified = true;
    await user.save();

    logger.info(`Email verified successfully for user: ${user.email}`);
    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    logger.error("Email verification error:", err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
};

export default {
  register,
  login,
  refresh,
  logout,
  sendError,
  upload,
  getTokenFromRequest,
  verifyEmail,
};

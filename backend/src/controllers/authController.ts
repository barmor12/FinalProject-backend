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

interface TokenPayload extends JwtPayload {
  userId: string;
}

// Enforce HTTPS middleware
const enforceHttps = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.status(403).send("Please use HTTPS for secure connections.");
  }
  next();
};

// Create the uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// Utility function to get token from request headers
export const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  return authHeader.split(" ")[1];
};

// Function to generate access and refresh tokens
const generateTokens = async (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h" } // Default expiration: 1 hour
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || "7d" } // Default expiration: 7 days
  );

  return { accessToken, refreshToken };
};

// Utility function to generate email verification token
const generateVerificationToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.EMAIL_SECRET!, { expiresIn: "1d" }); // Expires in 1 day
};

// Function to send email verification link
const sendVerificationEmail = async (email: string, token: string) => {
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
};

// Utility function to send error responses
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400
) => {
  if (!res.headersSent) {
    res.status(statusCode).json({ error: message });
  }
};

// Register function
export const register = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  let profilePic = req.file ? `/uploads/${req.file.filename}` : "";

  if (!firstName || !lastName || !email || !password) {
    logger.warn("Registration failed: Missing fields");
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
      isVerified: false,
    });

    const newUser = await user.save();

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

// Verify email function
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(
      token as string,
      process.env.EMAIL_SECRET!
    ) as TokenPayload;
    const user = await User.findById(decoded.userId);

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

// Login function
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

    if (!user.isVerified) {
      return sendError(res, "Email not verified. Please check your inbox.");
    }

    const tokens = await generateTokens(user._id.toString());
    user.refresh_tokens.push(tokens.refreshToken);
    await user.save();

    res.status(200).json({
      message: "User logged in successfully",
      tokens,
    });
  } catch (err) {
    logger.error("Login error:", err);
    sendError(res, "Failed to login", 500);
  }
};

// Refresh tokens function
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
    const user = await User.findById(payload.userId);

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
    logger.error("Refresh token error:", err);
    sendError(res, "Failed to refresh token", 500);
  }
};

// Logout function
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
    const user = await User.findById(payload.userId);

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    user.refresh_tokens = user.refresh_tokens.filter(
      (token) => token !== refreshToken
    );
    await user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    logger.error("Logout error:", err);
    sendError(res, "Failed to logout", 500);
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
};

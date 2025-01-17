import express, { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import User from "../models/userModel";
import dotenv from "dotenv";

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
    { expiresIn: process.env.JWT_TOKEN_EXPIRATION || '1h' }  // אם לא מוגדר, ברירת המחדל היא שעה
  );

  const refreshToken = jwt.sign(
    { _id: userId },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d' }  // אם לא מוגדר, ברירת המחדל היא 7 ימים
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

  // אם יש תמונה, נוסיף את נתיב התמונה
  if (req.file) {
    profilePic = `/uploads/${req.file.filename}`;
  }

  if (!firstName || !lastName || !email || !password) {
    return sendError(res, "All fields are required");
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, "User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profilePic,
      role: "user"
    });

    const newUser = await user.save();
    const tokens = await generateTokens(newUser._id.toString());
    res.status(201).json({ message: "User created successfully", user: newUser, tokens });
  } catch (err) {
    console.error("Registration error:", err);
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


export default {
  register,
  login,
  refresh,
  logout,
  sendError,
  upload,
  getTokenFromRequest,
};

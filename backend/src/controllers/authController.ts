import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import User from "../models/userModel";

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
    { expiresIn: process.env.JWT_TOKEN_EXPIRATION! }
  );

  const refreshToken = jwt.sign(
    { _id: userId },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION! }
  );

  return { accessToken, refreshToken };
};

const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400
) => {
  if (!res.headersSent) {
    res.status(statusCode).json({ error: message });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password, nickname } = req.body;
  let profilePic = "";

  if (req.file) {
    profilePic = `/uploads/${req.file.filename}`;
  }

  if (!email || !password || !nickname) {
    return sendError(res, "All fields are required");
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, "User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      profilePic,
      nickname,
    });

    const newUser = await user.save();
    const tokens = await generateTokens(newUser._id.toString());
    res.status(201).json({ user: newUser, tokens });
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

    res.status(200).send(tokens);
  } catch (err) {
    console.error("Login error:", err);
    sendError(res, "Failed to login", 500);
  }
};

export const getProfile = async (req: Request, res: Response) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return sendError(res, "Token required", 401);
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;

    const user = await User.findById(decoded._id).select(
      "-password -refresh_tokens"
    );
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    res.status(200).send(user);
  } catch (err) {
    console.error("Get profile error:", err);
    sendError(res, "Failed to get profile", 500);
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

export const updateProfile = async (req: Request, res: Response) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return sendError(res, "Token required", 401);
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;

    const user = await User.findById(decoded._id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const { nickname, email, oldPassword, newPassword } = req.body;

    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return sendError(res, "Old password is incorrect", 400);
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    user.nickname = nickname || user.nickname;
    user.email = email || user.email;

    const updatedUser = await user.save();
    res.status(200).send(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err);
    sendError(res, "Failed to update profile", 500);
  }
};

export default {
  register,
  login,
  getProfile,
  refresh,
  logout,
  updateProfile,
  sendError,
  upload,
};

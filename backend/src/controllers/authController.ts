import { OAuth2Client } from "google-auth-library";
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
import cloudinary from "../config/cloudinary";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID_IOS);

export const googleCallback = async (req: Request, res: Response) => {
  const { id_token, password } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID_IOS,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res
        .status(400)
        .json({ error: "Failed to get payload from token" });
    }

    if (!payload.email) {
      return res.status(400).json({ error: "Google account must have an email" });
    }

    // First check if user exists by googleId
    let user = await User.findOne({ googleId: payload.sub });

    // If no user found by googleId, check by email
    if (!user) {
      user = await User.findOne({ email: payload.email });

      if (user) {
        // User exists with this email but not linked to Google
        logger.info(`[INFO] Linking existing user account (${user._id}) with Google ID (${payload.sub})`);

        // Link Google ID to the existing account
        user.googleId = payload.sub;

        // If user doesn't have a profile picture but Google does, use the Google one
        if (!user.profilePic && payload.picture) {
          user.profilePic = {
            url: payload.picture,
            public_id: `google_${payload.sub}`
          };
        }

        await user.save();
      } else {
        // No user exists with this email, create a new one
        logger.info(`[INFO] Creating new user from Google login: ${payload.email}`);

        const hashedPassword = await bcrypt.hash(
          password || payload.sub + "google",
          10
        );

        user = new User({
          googleId: payload.sub,
          email: payload.email,
          firstName: payload.given_name || "Google",
          lastName: payload.family_name || "User",
          profilePic: payload.picture ? {
            url: payload.picture,
            public_id: `google_${payload.sub}`
          } : undefined,
          password: hashedPassword,
          role: "user",
          isVerified: true, // Google users are automatically verified
        });

        await user.save();
        logger.info(`[INFO] New user created from Google login: ${user._id}`);
      }
    } else if (!user.password) {
      // If user exists but doesn't have a password (rare case)
      const hashedPassword = await bcrypt.hash(
        password || payload.sub + "google",
        10
      );
      user.password = hashedPassword;
      await user.save();
    }

    const tokens = await generateTokens(user._id.toString(), user.role);
    // Associate refresh token for persistence
    user.refresh_tokens.push(tokens.refreshToken);
    await user.save();

    // Return tokens in the exact same format as regular login
    res.status(200).json({
      message: "User logged in successfully via Google",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
      userId: user._id.toString(),
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).json({ error: "Failed to authenticate user" });
  }
};

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

// הגדרת Multer להעלאת קבצים
const storage = multer.memoryStorage();
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

    // Fix the URL format to ensure proper protocol format with colon
    const frontendUrl = process.env.FRONTEND_URL || '';
    let verificationLink = '';

    // Properly format the URL with the correct protocol
    if (frontendUrl.startsWith('http://') || frontendUrl.startsWith('https://')) {
      verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;
    } else {
      // Add http:// protocol if missing
      verificationLink = `http://${frontendUrl}/auth/verify-email?token=${token}`;
    }

    // Log the verification link for debugging
    logger.info(`[DEBUG] Generated verification link: ${verificationLink}`);

    // Get user details to personalize the email
    const user = await User.findOne({ email });
    const firstName = user ? user.firstName : '';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Poppins', sans-serif;
              color: #333333;
              line-height: 1.6;
              background-color: #f4f4f9;
              padding: 20px;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }
            
            .email-header {
              background-color: #5a3827;
              padding: 30px 20px;
              text-align: center;
              border-bottom: 4px solid #6b4232;
            }
            
            .email-header h1 {
              color: white;
              font-size: 28px;
              font-weight: 600;
              margin: 0;
              letter-spacing: 0.5px;
            }
            
            .email-body {
              padding: 40px 30px;
              text-align: center;
              background-color: #fff;
            }
            
            .email-body p {
              margin-bottom: 20px;
              font-size: 16px;
              color: #555;
            }
            
            .greeting {
              font-size: 18px;
              font-weight: 500;
              margin-bottom: 25px;
              color: #333;
            }
            
            .verification-button {
              display: inline-block;
              background-color: #5a3827;
              color: white;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 50px;
              font-weight: 600;
              font-size: 16px;
              margin: 30px 0;
              box-shadow: 0 4px 12px rgba(90, 56, 39, 0.3);
              transition: all 0.3s ease;
              letter-spacing: 0.5px;
              border: none;
            }
            
            .verification-button:hover {
              background-color: #6b4232;
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(90, 56, 39, 0.4);
            }
            
            .expiry-notice {
              font-size: 14px;
              color: #888;
              margin-top: 25px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            
            .email-footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 13px;
              color: #777;
              border-top: 1px solid #eee;
            }
            
            .logo {
              margin-bottom: 15px;
            }
            
            .logo img {
              max-height: 50px;
            }
            
            /* Responsive adjustments */
            @media only screen and (max-width: 480px) {
              .email-container {
                border-radius: 8px;
              }
              
              .email-header {
                padding: 20px 15px;
              }
              
              .email-header h1 {
                font-size: 24px;
              }
              
              .email-body {
                padding: 25px 20px;
              }
              
              .verification-button {
                padding: 14px 30px;
                font-size: 15px;
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Email Verification</h1>
            </div>
            
            <div class="email-body">
              <p class="greeting">Hello${firstName ? ' ' + firstName : ''},</p>
              <p>Thank you for registering with us. To complete your registration and verify your email address, please click on the button below:</p>
              
              <a href="${verificationLink}" class="verification-button" style="color: #ffffff; text-decoration: none;">Verify My Email</a>
              
              <div class="expiry-notice">
                This link will expire in 24 hours for security reasons.
              </div>
            </div>
            
            <div class="email-footer">
              <p>If you didn't request this verification, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} My Cake Shop. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`[INFO] Verification email sent to: ${email} with link: ${verificationLink}`);
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

  logger.info(`[INFO] Attempting to register user: ${email}`);

  if (!firstName || !lastName || !email || !password) {
    logger.warn("[WARN] Registration failed: Missing fields");
    return sendError(res, "All fields are required", 400);
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    return sendError(
      res,
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
      400
    );
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`[WARN] Registration failed: Email ${email} already exists`);
      return sendError(res, "User with this email already exists", 409);
    }

    let profilePic = {
      url: "https://res.cloudinary.com/dhhrsuudb/image/upload/v1743463363/default_profile_image.png",
      public_id: "users/default_profile_image",
    };

    if (req.file) {
      logger.info("[INFO] Uploading profile image to Cloudinary...");

      const streamUpload = (buffer: Buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "users" },
            (error: any, result: any) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          const { Readable } = require("stream");
          Readable.from(buffer).pipe(stream);
        });
      };

      try {
        const uploadResult: any = await streamUpload(req.file.buffer);
        profilePic = {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        };
        logger.info("[INFO] Profile image uploaded successfully");
      } catch (error: any) {
        logger.error(`[ERROR] Cloudinary upload error: ${error.message}`);
        return sendError(res, "Profile image upload failed", 500);
      }
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
      user: newUser,
    });
  } catch (err) {
    logger.error(`[ERROR] Registration error: ${(err as Error).message}`);
    sendError(res, "Failed to register", 500);
  }
};

// Generate and send 2FA code
const generateAndSend2FACode = async (email: string) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  user.twoFactorCode = code;
  user.twoFactorExpires = expiresAt;
  await user.save();

  // Send email with 2FA code
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error("Email credentials are missing in environment variables");
  }

  const transporter = nodemailer.createTransport({
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

  await transporter.sendMail(mailOptions);
  logger.info(`[INFO] 2FA code sent to: ${email}`);
};

// Enable 2FA
export const enable2FA = async (req: Request, res: Response) => {
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

    // Generate and send verification code
    await generateAndSend2FACode(user.email);

    res.status(200).json({
      message: "Verification code sent to your email",
      requiresVerification: true,
    });
  } catch (err) {
    logger.error(`[ERROR] Enable 2FA error: ${(err as Error).message}`);
    sendError(res, "Failed to enable 2FA", 500);
  }
};

// Verify 2FA code
export const verify2FACode = async (req: Request, res: Response) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return sendError(res, "Token required", 401);
  }

  const { code } = req.body;
  if (!code) {
    return sendError(res, "Verification code is required", 400);
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

    if (!user.twoFactorCode || !user.twoFactorExpires) {
      return sendError(res, "No 2FA code found", 400);
    }

    if (user.twoFactorCode !== code) {
      return sendError(res, "Invalid 2FA code", 400);
    }

    if (Date.now() > user.twoFactorExpires.getTime()) {
      return sendError(res, "2FA code has expired", 400);
    }

    // Enable 2FA and clear the verification code
    user.twoFactorEnabled = true;
    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "2FA enabled successfully",
      twoFactorEnabled: true,
    });
  } catch (err) {
    logger.error(`[ERROR] Verify 2FA code error: ${(err as Error).message}`);
    sendError(res, "Failed to verify 2FA code", 500);
  }
};

// Disable 2FA
export const disable2FA = async (req: Request, res: Response) => {
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

    user.twoFactorEnabled = false;
    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    res.status(200).json({ message: "2FA disabled successfully" });
  } catch (err) {
    logger.error(`[ERROR] Disable 2FA error: ${(err as Error).message}`);
    sendError(res, "Failed to disable 2FA", 500);
  }
};

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

    // If 2FA is enabled, send code and return temporary tokens
    if (user.twoFactorEnabled) {
      await generateAndSend2FACode(email);

      // Generate temporary tokens for 2FA verification
      const tempTokens = await generateTokens(user._id.toString(), user.role);

      res.status(200).json({
        message: "2FA code sent to email",
        requires2FA: true,
        tokens: tempTokens,
        userId: user._id.toString(),
        role: user.role,
      });
      return;
    }

    const tokens = await generateTokens(user._id.toString(), user.role);
    logger.info(`[INFO] Generated tokens for user: ${email}`);

    user.refresh_tokens.push(tokens.refreshToken);
    await user.save();

    res.status(200).json({
      message: "User logged in successfully",
      tokens,
      role: user.role,
      userId: user._id.toString(),
    });
  } catch (err) {
    logger.error(`[ERROR] Login error: ${(err as Error).message}`);
    sendError(res, "Failed to login", 500);
  }
};
export const get2FAStatus = async (req: Request, res: Response) => {
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

    res.status(200).json({
      isEnabled: user.twoFactorEnabled || false,
    });
  } catch (err) {
    logger.error(`[ERROR] Get 2FA status error: ${(err as Error).message}`);
    sendError(res, "Failed to get 2FA status", 500);
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

    // יצירת קוד אימות ושמירה במסד הנתונים
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 דקות

    user.resetToken = resetCode;
    user.resetExpires = expiresAt;
    await user.save();

    // שליחת אימייל
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
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // בדיקת קוד השחזור והתוקף
    if (
      !user.resetToken ||
      user.resetToken !== code ||
      !user.resetExpires ||
      Date.now() > user.resetExpires.getTime()
    ) {
      return sendError(res, "Invalid or expired reset code", 400);
    }

    // מחיקת קוד האיפוס לאחר השימוש
    await User.updateOne(
      { email },
      { $unset: { resetToken: 1, resetExpires: 1 } }
    );

    // עדכון הסיסמה לאחר אימות
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
  googleCallback,
  enable2FA,
  disable2FA,
  verify2FACode,
  get2FAStatus,
};

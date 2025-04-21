import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sendError, getTokenFromRequest } from "../controllers/authController";
import User from "../models/userModel";

// מבנה הטוקן
interface TokenPayload extends JwtPayload {
  _id?: string; // מזהה המשתמש
  userId?: string; // תמיכה בשני הפורמטים
  role?: string; // תפקיד המשתמש
}

// Middleware לאימות אדמין
const authenticateAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      console.error("[ERROR] Missing token in request headers.");
      return sendError(res, "Token is required for authentication", 401);
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      console.error(
        "[ERROR] Missing ACCESS_TOKEN_SECRET in environment variables."
      );
      return sendError(res, "Token secret is not defined", 500);
    }

    // פענוח הטוקן
    const decoded = jwt.verify(token, secret) as TokenPayload;

    console.log("[INFO] Decoded token payload:", decoded);

    // בדיקה אם הטוקן מכיל מזהה משתמש ותפקיד
    const userId = decoded._id || decoded.userId; // תמיכה בשני השמות
    const userRole = decoded.role;

    if (!userId || !userRole) {
      console.error("[ERROR] Invalid token structure:", decoded);
      return sendError(res, "Invalid token data", 403);
    }

    // חיפוש המשתמש בבסיס הנתונים
    const user = await User.findById(userId);


    if (!user) {
      console.error("[ERROR] User not found for ID:", userId);
      return sendError(res, "User not found", 404);
    }

    if (user.role !== "admin") {
      console.error(
        "[ERROR] Access denied. User is not an admin. Role:",
        user.role
      );
      return sendError(res, "Access denied, admin privileges required", 403);
    }

    // הוספת מזהה המשתמש לבקשה
    req.body.userId = user._id;

    console.log(
      "[INFO] Admin authentication successful for user ID:",
      user._id
    );
    next();
  } catch (err: any) {
    console.error("[ERROR] Authentication middleware error:", err.message);
    if (err.name === "TokenExpiredError") {
      return sendError(res, "Token has expired", 401);
    } else if (err.name === "JsonWebTokenError") {
      return sendError(res, "Invalid token", 403);
    } else {
      return sendError(res, "Authentication failed", 500);
    }
  }
};

export default authenticateAdminMiddleware;

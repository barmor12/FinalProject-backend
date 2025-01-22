import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sendError, getTokenFromRequest } from "../controllers/authController";
import User from "../models/userModel";

// הגדרת מבנה נתונים של הטוקן
interface TokenPayload extends JwtPayload {
  _id: string;
}

// Middleware לאימות אדמין
const authenticateAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // שליפת הטוקן מתוך הבקשה
    const token = getTokenFromRequest(req);

    if (!token) {
      return sendError(res, "Token is required for authentication", 401);
    }

    // בדיקת הטוקן ואימותו
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;

    if (!decoded || !decoded._id) {
      return sendError(res, "Invalid token data", 403);
    }

    // בדיקת אם המשתמש קיים במאגר
    const user = await User.findById(decoded._id);

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // בדיקת תפקיד המשתמש (אם אינו admin)
    if (user.role !== "admin") {
      return sendError(res, "Access denied, admin privileges required", 403);
    }

    // הוספת מזהה המשתמש לבקשה להמשך שימוש
    req.body.userId = user._id;

    console.log(
      `[INFO] Admin authentication successful for user ID: ${user._id}`
    );

    // העברת הבקשה ל-Next middleware
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      console.error(`[ERROR] Token expired: ${err.message}`);
      return sendError(res, "Token has expired", 401);
    } else if (err.name === "JsonWebTokenError") {
      console.error(`[ERROR] Invalid token: ${err.message}`);
      return sendError(res, "Invalid token", 403);
    } else {
      console.error(`[ERROR] Authentication error: ${err.message}`);
      return sendError(res, "Authentication failed", 500);
    }
  }
};

export default authenticateAdminMiddleware;

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import sendError from "../controllers/authController";
import { getTokenFromRequest } from "../controllers/authController";

interface TokenPayload {
  _id: string;
}

// פונקציה לבדיקת מבנה נתונים של הטוקן
function isTokenPayload(payload: any): payload is TokenPayload {
  return payload && typeof payload === "object" && "_id" in payload;
}

// Middleware לאימות טוקן
const authenticateMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return sendError.sendError(res, "Token required", 401); // טוקן חסר
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;

    if (!isTokenPayload(decoded)) {
      return sendError.sendError(res, "Invalid token data", 403); // טוקן לא חוקי
    }

    // הוספת מזהה המשתמש לבקשה
    req.body.userId = decoded._id;

    console.log("Authenticated user ID: " + decoded._id); // פלט לדיבוג

    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return sendError.sendError(res, "Token expired", 401); // טוקן שפג תוקפו
    }

    console.error("Authentication error:", err); // לוג לשגיאות
    return sendError.sendError(res, "Invalid token", 403); // טוקן לא חוקי
  }
};

export default authenticateMiddleware;

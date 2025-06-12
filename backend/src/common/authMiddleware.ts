import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sendError, getTokenFromRequest } from '../controllers/authController';

// הגדרת מבנה הטוקן
interface TokenPayload extends JwtPayload {
  userId: string; // שדה זה ישתמש ב-userId במקום _id
  role?: string; // במידת הצורך, ניתן להוסיף גם role
}

// פונקציה לבדיקת מבנה הטוקן
function isTokenPayload(payload: any): payload is TokenPayload {
  return payload && typeof payload === 'object' && 'userId' in payload; // כאן נשנה ל- userId
}

// Middleware לאימות משתמשים
const authenticateMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    return next();
  }
  try {
    // בדיקה אם הסוד מוגדר ב-.env
    if (!process.env.ACCESS_TOKEN_SECRET) {
      console.error(
        '[ERROR] ACCESS_TOKEN_SECRET is not defined in environment variables.'
      );
      throw new Error('Missing ACCESS_TOKEN_SECRET in environment variables');
    }

    // שליפת הטוקן מתוך הבקשה
    const token = getTokenFromRequest(req);

    if (!token) {
      console.error('[ERROR] Token is missing from the request');
      return sendError(res, 'Authorization token is required', 401);
    }

    // פענוח הטוקן
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    ) as TokenPayload;
    req.user = decoded;

    // בדיקת מבנה הטוקן
    if (!isTokenPayload(decoded)) {
      console.error('[ERROR] Invalid token payload structure:', decoded);
      return sendError(res, 'Invalid token data', 403);
    }

    // הוספת המשתמש לבקשה
    req.user = decoded;

    // אם יש צורך לבדוק role, ניתן לעשות כאן
    if (decoded.role) {
    }

    // העברת הבקשה ל-Next Middleware
    next();
  } catch (err: any) {
    console.error('[ERROR] Error verifying token:', err.message);
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token has expired', 401);
    } else if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 403);
    }
    return sendError(res, 'Authentication failed', 500);
  }
};

export default authenticateMiddleware;

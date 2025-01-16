import { Request, Response, NextFunction } from "express";
declare const authenticateAdminMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default authenticateAdminMiddleware;

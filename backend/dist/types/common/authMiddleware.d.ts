import { Request, Response, NextFunction } from "express";
declare const authenticateMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default authenticateMiddleware;

import { Request, Response } from "express";
import multer from "multer";
export declare const getTokenFromRequest: (req: Request) => string | null;
export declare const sendError: (res: Response, message: string, statusCode?: number) => void;
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const refresh: (req: Request, res: Response) => Promise<void>;
export declare const logout: (req: Request, res: Response) => Promise<void>;
declare const _default: {
    register: (req: Request, res: Response) => Promise<void>;
    login: (req: Request, res: Response) => Promise<void>;
    refresh: (req: Request, res: Response) => Promise<void>;
    logout: (req: Request, res: Response) => Promise<void>;
    sendError: (res: Response, message: string, statusCode?: number) => void;
    upload: multer.Multer;
    getTokenFromRequest: (req: Request) => string | null;
};
export default _default;

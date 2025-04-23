import { Request, Response } from "express";
export declare const sendReviewEmail: (req: Request, res: Response) => Promise<void>;
export declare const sendEmailToUser: (req: Request, res: Response) => Promise<void>;
export declare const deleteUserWithEmail: (req: Request, res: Response) => Promise<void>;

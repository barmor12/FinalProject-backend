import { Request, Response } from "express";
export declare const createDiscountCode: (req: Request, res: Response) => Promise<void>;
export declare const getAllDiscountCodes: (_req: Request, res: Response) => Promise<void>;
export declare const validateDiscountCode: (req: Request, res: Response) => Promise<void>;
export declare const deleteDiscountCode: (req: Request, res: Response) => Promise<void>;

import { Request, Response } from "express";
export declare const addToCart: (req: Request, res: Response) => Promise<void>;
export declare const cartGet: (req: Request, res: Response) => Promise<void | Response<any, Record<string, any>>>;
export declare const removeFromCart: (req: Request, res: Response) => Promise<void>;
declare const _default: {
    addToCart: (req: Request, res: Response) => Promise<void>;
    getCart: any;
    removeFromCart: (req: Request, res: Response) => Promise<void>;
};
export default _default;

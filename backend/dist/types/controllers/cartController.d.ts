import { Request, Response } from "express";
export declare const addToCart: (req: Request, res: Response) => Promise<void>;
export declare const updateCartItem: (req: Request, res: Response) => Promise<void>;
export declare const getCart: (req: Request, res: Response) => Promise<void>;
export declare const removeFromCart: (req: Request, res: Response) => Promise<void>;
export declare const clearCart: (req: Request, res: Response) => Promise<void>;
declare const _default: {
    addToCart: (req: Request, res: Response) => Promise<void>;
    updateCartItem: (req: Request, res: Response) => Promise<void>;
    getCart: (req: Request, res: Response) => Promise<void>;
    removeFromCart: (req: Request, res: Response) => Promise<void>;
    clearCart: (req: Request, res: Response) => Promise<void>;
};
export default _default;

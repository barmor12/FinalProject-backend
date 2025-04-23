import { Request, Response } from "express";
export declare const getAllOrders: (req: Request, res: Response) => Promise<void>;
export declare const getStats: (req: Request, res: Response) => Promise<void>;
export declare const updateOrder: (req: Request, res: Response) => Promise<void>;
export declare const updateUser: (req: Request, res: Response) => Promise<void>;
export declare const getAllUsers: (req: Request, res: Response) => Promise<void>;
export declare const getUserById: (req: Request, res: Response) => Promise<void>;
export declare const toggleOrderPriority: (req: Request, res: Response) => Promise<void>;
declare const _default: {
    getAllOrders: (req: Request, res: Response) => Promise<void>;
    updateOrder: (req: Request, res: Response) => Promise<void>;
    getAllUsers: (req: Request, res: Response) => Promise<void>;
    getUserById: (req: Request, res: Response) => Promise<void>;
    updateUser: (req: Request, res: Response) => Promise<void>;
    getStats: (req: Request, res: Response) => Promise<void>;
    toggleOrderPriority: (req: Request, res: Response) => Promise<void>;
};
export default _default;

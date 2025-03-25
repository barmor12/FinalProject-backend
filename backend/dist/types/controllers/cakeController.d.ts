import { Request, Response } from 'express';
export declare const addCake: (req: Request, res: Response) => Promise<void>;
export declare const updateCake: (req: Request, res: Response) => Promise<void>;
export declare const getAllCakes: (req: Request, res: Response) => Promise<void>;
export declare const deleteCake: (req: Request, res: Response) => Promise<void>;
export declare const getFavorites: (req: Request, res: Response) => Promise<void>;
export declare const addToFavorites: (req: Request, res: Response) => Promise<void>;
export declare const removeFromFavorites: (req: Request, res: Response) => Promise<void>;
export declare const updateStock: (req: Request, res: Response) => Promise<void>;

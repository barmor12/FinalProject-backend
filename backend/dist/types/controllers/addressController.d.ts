import { Request, Response } from "express";
export declare const getUserAddresses: (req: Request, res: Response) => Promise<void>;
export declare const addAddress: (req: Request, res: Response) => Promise<void>;
export declare const setDefaultAddress: (req: Request, res: Response) => Promise<void>;
export declare const updateAddress: (req: Request, res: Response) => Promise<void>;
export declare const deleteAddress: (req: Request, res: Response) => Promise<void>;

import { Request, Response } from "express";
export declare const updateUserName: (req: Request, res: Response) => Promise<void>;
export declare const updateUserProfilePic: (req: Request, res: Response) => Promise<void>;
export declare const getProfile: (req: Request, res: Response) => Promise<void>;
export declare const deleteProfile: (req: Request, res: Response) => Promise<void>;
declare const _default: {
    getProfile: (req: Request, res: Response) => Promise<void>;
    updateUserName: (req: Request, res: Response) => Promise<void>;
    updateUserProfilePic: (req: Request, res: Response) => Promise<void>;
    deleteProfile: (req: Request, res: Response) => Promise<void>;
};
export default _default;

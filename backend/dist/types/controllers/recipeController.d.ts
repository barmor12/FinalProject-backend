import { Request, Response } from "express";
export declare const getAllRecipes: (req: Request, res: Response) => Promise<void>;
export declare const addRecipe: (req: Request, res: Response) => Promise<void>;
export declare const updateRecipe: (req: Request, res: Response) => Promise<void>;
export declare const deleteRecipe: (req: Request, res: Response) => Promise<void>;
export declare const getRecipeById: (req: Request, res: Response) => Promise<void>;

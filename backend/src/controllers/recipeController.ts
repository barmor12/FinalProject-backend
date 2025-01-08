import { Request, Response } from "express";
import Recipe from "../models/recipeModel";

// קבלת כל המתכונים
export const getAllRecipes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const recipes = await Recipe.find().populate("createdBy", "nickname");
    res.status(200).json(recipes);
  } catch (err) {
    console.error("Failed to fetch recipes:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
};

// הוספת מתכון חדש
export const addRecipe = async (req: Request, res: Response): Promise<void> => {
  const { title, ingredients, instructions } = req.body;
  const userId = req.body.userId;

  if (!title || !ingredients || !instructions) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    const recipe = new Recipe({
      title,
      ingredients: ingredients.split(","),
      instructions,
      createdBy: userId,
      image: req.file ? `/uploads/${req.file.filename}` : undefined,
    });

    const savedRecipe = await recipe.save();
    res.status(201).json(savedRecipe);
  } catch (err) {
    console.error("Failed to save recipe:", err);
    res.status(500).json({ error: "Failed to save recipe" });
  }
};

// עדכון מתכון
export const updateRecipe = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { title, ingredients, instructions } = req.body;
  const recipeId = req.params.id;

  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      {
        title,
        ingredients: ingredients?.split(","),
        instructions,
        image: req.file ? `/uploads/${req.file.filename}` : undefined,
      },
      { new: true }
    );

    if (!updatedRecipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.status(200).json(updatedRecipe);
  } catch (err) {
    console.error("Failed to update recipe:", err);
    res.status(500).json({ error: "Failed to update recipe" });
  }
};

// מחיקת מתכון
export const deleteRecipe = async (
  req: Request,
  res: Response
): Promise<void> => {
  const recipeId = req.params.id;

  try {
    const deletedRecipe = await Recipe.findByIdAndDelete(recipeId);

    if (!deletedRecipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (err) {
    console.error("Failed to delete recipe:", err);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
};

// קבלת מתכון לפי ID
export const getRecipeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const recipeId = req.params.id;

  try {
    const recipe = await Recipe.findById(recipeId).populate(
      "createdBy",
      "nickname"
    );

    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.status(200).json(recipe);
  } catch (err) {
    console.error("Failed to fetch recipe:", err);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
};

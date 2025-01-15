import { Request, Response } from "express";
import Recipe from "../models/recipeModel";
import fs from "fs";
import path from "path";

// קבלת כל המתכונים
export const getAllRecipes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // חיפוש כל המתכונים ומילוי הפניה למשתמש שיצר את המתכון
    const recipes = await Recipe.find().populate("user", "nickname");
    res.status(200).json(recipes);
  } catch (err) {
    console.error("Failed to fetch recipes:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
};


// הוספת מתכון חדש
export const addRecipe = async (req: Request, res: Response): Promise<void> => {
  const { title, description, ingredients, instructions, userId } = req.body;

  // בדיקת אם כל השדות הנדרשים הוזנו
  if (!title || !description || !ingredients || !instructions || !userId) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    const recipe = new Recipe({
      title,
      description,  // הוספנו את שדה ה־description
      ingredients: ingredients.split(","),  // המרת המרכיבים לרשימה (מערך)
      instructions: instructions.split(","),  // המרת ההוראות לרשימה (מערך)
      user: userId,  // הפניה למשתמש שיצר את המתכון
      image: req.file ? `/uploads/${req.file.filename}` : undefined,  // אם יש תמונה, הוספה שלה
    });

    const savedRecipe = await recipe.save();  // שמירת המתכון בבסיס הנתונים
    res.status(201).json(savedRecipe);  // החזרת המתכון שנשמר כתגובה
  } catch (err) {
    console.error("Failed to save recipe:", err);
    res.status(500).json({ error: "Failed to save recipe" });  // טיפול בשגיאות
  }
};



// פונקציה לעדכון מתכון
export const updateRecipe = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { title, description, ingredients, instructions } = req.body;
  const recipeId = req.params.id;

  // בדיקה אם כל השדות נמסרו
  if (!title || !description || !ingredients || !instructions) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    // אם יש קובץ חדש לתמונה, מחליפים את התמונה הישנה
    let imageUrl = undefined;
    if (req.file) {
      const oldRecipe = await Recipe.findById(recipeId);
      if (oldRecipe?.image) {
        const oldImagePath = path.join(__dirname, "..", oldRecipe.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // מחיקת התמונה הישנה מהמערכת
        }
      }
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // עדכון המתכון במסד הנתונים
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      {
        title,
        description,
        ingredients: ingredients.split(","),
        instructions,
        image: imageUrl || undefined, // אם אין תמונה חדשה, לא משנה את השדה
      },
      { new: true } // מחזיר את המתכון המעודכן
    );

    if (!updatedRecipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    // שליחת התגובה עם המתכון המעודכן
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
      "user",
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

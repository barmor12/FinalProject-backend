import { Request, Response } from "express";
import Recipe from "../models/recipeModel";
import logger from "../logger";
import cloudinary from "../config/cloudinary";

// Create a new recipe
export const createRecipe = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      servings,
      ingredients,
      instructions,
      difficulty,
      makingTime,
    } = req.body;

    if (!name || !description || !servings || !ingredients || !instructions || !difficulty || !makingTime) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      res.status(400).json({ error: "Difficulty must be one of: Easy, Medium, Hard" });
      return;
    }

    const makingTimeNum = parseInt(makingTime);
    if (isNaN(makingTimeNum) || makingTimeNum < 1) {
      res.status(400).json({ error: "Making time must be a positive number" });
      return;
    }

    // Parse ingredients from object to array
    const parsedIngredients = Object.entries(JSON.parse(ingredients)).map(([_, value]) => value);

    // Parse instructions from object to array of instruction objects
    const parsedInstructions = Object.entries(JSON.parse(instructions)).map(([_, value]: [string, any], index) => ({
      step: index + 1,
      instruction: typeof value === 'object' ? value.instruction : value
    }));

    // Handle image upload
    let imageData;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "recipes",
      });
      imageData = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    } else {
      res.status(400).json({ error: "Recipe image is required" });
      return;
    }

    // Create new recipe
    const recipe = new Recipe({
      name,
      description,
      servings: parseInt(servings),
      difficulty,
      makingTime: makingTimeNum,
      image: imageData,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
    });

    await recipe.save();
    logger.info(`[INFO] Recipe created successfully: ${recipe._id}`);

    res.status(201).json(recipe);
  } catch (error) {
    logger.error(`[ERROR] Error creating recipe: ${error}`);
    res.status(500).json({ error: "Failed to create recipe" });
  }
};

// Get all recipes
export const getRecipes = async (req: Request, res: Response) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.status(200).json(recipes);
  } catch (error) {
    logger.error(`[ERROR] Error fetching recipes: ${error}`);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
};

// Get a single recipe
export const getRecipe = async (req: Request, res: Response) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    res.status(200).json(recipe);
  } catch (error) {
    logger.error(`[ERROR] Error fetching recipe: ${error}`);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
};

// Update a recipe
export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const { name, description, servings, ingredients, directions, difficulty, makingTime } = req.body;
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    // Validate difficulty if provided
    if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      res.status(400).json({ error: "Difficulty must be one of: Easy, Medium, Hard" });
      return;
    }

    // Validate makingTime if provided
    if (makingTime) {
      const makingTimeNum = parseInt(makingTime);
      if (isNaN(makingTimeNum) || makingTimeNum < 1) {
        res.status(400).json({ error: "Making time must be a positive number" });
        return;
      }
      recipe.makingTime = makingTimeNum;
    }

    // Handle image update if new image is provided
    if (req.file && recipe.image) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(recipe.image.public_id);

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "recipes"
      });

      recipe.image = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    // Update recipe fields
    recipe.name = name || recipe.name;
    recipe.description = description || recipe.description;
    recipe.servings = servings || recipe.servings;
    recipe.difficulty = difficulty || recipe.difficulty;
    recipe.ingredients = ingredients || recipe.ingredients;
    recipe.instructions = directions || recipe.instructions;

    await recipe.save();
    logger.info(`[INFO] Recipe updated successfully: ${recipe._id}`);

    res.status(200).json(recipe);
  } catch (error) {
    logger.error(`[ERROR] Error updating recipe: ${error}`);
    res.status(500).json({ error: "Failed to update recipe" });
  }
};

// Delete a recipe
export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    // Delete image from Cloudinary
    if (recipe.image) {
      await cloudinary.uploader.destroy(recipe.image.public_id);
    }

    await recipe.deleteOne();
    logger.info(`[INFO] Recipe deleted successfully: ${recipe._id}`);

    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (error) {
    logger.error(`[ERROR] Error deleting recipe: ${error}`);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
};

export default {
  createRecipe,
  getRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe
};

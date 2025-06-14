import { Request, Response } from 'express';
import Recipe from '../models/recipeModel';
import logger from '../logger';
import cloudinary from '../config/cloudinary';
import mongoose from 'mongoose';
import jwt, { JwtPayload } from 'jsonwebtoken';

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
      category,
    } = req.body;
    if (!name || !description || !servings || !ingredients || !instructions || !difficulty || !makingTime || !category) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      res.status(400).json({ error: 'Difficulty must be one of: Easy, Medium, Hard' });
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
        folder: 'recipes',
      });
      imageData = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    } else {
      res.status(400).json({ error: 'Recipe image is required' });
      return;
    }

    // Create new recipe
    const recipe = new Recipe({
      name,
      description,
      servings: parseInt(servings),
      difficulty,
      makingTime,
      category,
      image: imageData,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
      likes: 0,
      likedBy: []
    });

    await recipe.save();
    logger.info(`[INFO] Recipe created successfully: ${recipe._id}`);

    res.status(201).json(recipe);
  } catch (error) {
    logger.error(`[ERROR] Error creating recipe: ${error}`);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
};

// Get all recipes
export const getRecipes = async (req: Request, res: Response) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.status(200).json(recipes);
  } catch (error) {
    logger.error(`[ERROR] Error fetching recipes: ${error}`);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
};

// Get a single recipe
export const getRecipe = async (req: Request, res: Response) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }
    res.status(200).json(recipe);
  } catch (error) {
    logger.error(`[ERROR] Error fetching recipe: ${error}`);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
};

// Update a recipe
export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const { name, description, servings, ingredients, directions, difficulty, makingTime, category } = req.body;
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // Validate difficulty if provided
    if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      res.status(400).json({ error: 'Difficulty must be one of: Easy, Medium, Hard' });
      return;
    }

    // Validate makingTime if provided
    if (!makingTime) {
      recipe.makingTime = '';
    }

    // Handle image update if new image is provided
    if (req.file && recipe.image) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(recipe.image.public_id);

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'recipes'
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
    recipe.category = category || recipe.category;

    await recipe.save();
    logger.info(`[INFO] Recipe updated successfully: ${recipe._id}`);

    res.status(200).json(recipe);
  } catch (error) {
    logger.error(`[ERROR] Error updating recipe: ${error}`);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
};

// Like a recipe
export const likeRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get userId from authentication token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Authorization token is required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload;
    const userId = decoded.userId;
    if (!userId) {
      res.status(401).json({ error: 'Invalid token - user ID not found' });
      return;
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // Check if user already liked this recipe
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = recipe.likedBy.some(id => id.equals(userIdObj));

    if (alreadyLiked) {
      res.status(400).json({ error: 'You already liked this recipe' });
      return;
    }

    // Add user to likedBy array and increment likes count
    recipe.likedBy.push(userIdObj);
    recipe.likes += 1;

    await recipe.save();
    logger.info(`[INFO] Recipe liked successfully: ${recipe._id} by user: ${userId}`);

    res.status(200).json({
      message: 'Recipe liked successfully',
      likes: recipe.likes
    });
  } catch (error) {
    logger.error(`[ERROR] Error liking recipe: ${error}`);
    res.status(500).json({ error: 'Failed to like recipe' });
  }
};

// Unlike a recipe
export const unlikeRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get userId from authentication token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Authorization token is required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload;
    const userId = decoded.userId;
    if (!userId) {
      res.status(401).json({ error: 'Invalid token - user ID not found' });
      return;
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // Check if user has liked this recipe
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const likedIndex = recipe.likedBy.findIndex(id => id.equals(userIdObj));

    if (likedIndex === -1) {
      res.status(400).json({ error: 'You haven\'t liked this recipe yet' });
      return;
    }

    // Remove user from likedBy array and decrement likes count
    recipe.likedBy.splice(likedIndex, 1);
    recipe.likes = Math.max(0, recipe.likes - 1); // Ensure likes don't go below 0

    await recipe.save();
    logger.info(`[INFO] Recipe unliked successfully: ${recipe._id} by user: ${userId}`);

    res.status(200).json({
      message: 'Recipe unliked successfully',
      likes: recipe.likes
    });
  } catch (error) {
    logger.error(`[ERROR] Error unliking recipe: ${error}`);
    res.status(500).json({ error: 'Failed to unlike recipe' });
  }
};

// Delete a recipe
export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // Delete image from Cloudinary
    if (recipe.image) {
      await cloudinary.uploader.destroy(recipe.image.public_id);
    }

    await recipe.deleteOne();
    logger.info(`[INFO] Recipe deleted successfully: ${recipe._id}`);

    res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    logger.error(`[ERROR] Error deleting recipe: ${error}`);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
};

export const updateRecipeData = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      servings,
      ingredients,
      instructions,
      difficulty,
      makingTime,
      category,
    } = req.body;

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      res.status(400).json({ error: 'Difficulty must be one of: Easy, Medium, Hard' });
      return;
    }

    // Parse ingredients and instructions
    try {
      // Ensure ingredients are properly formatted objects with name, amount, and unit
      const parsedIngredients = Object.entries(ingredients).map(([_, value]) => {
        // If value is a string, attempt to parse it into object format
        if (typeof value === 'string') {
          // Try to extract amount, unit, and name
          const parts = value.trim().split(' ');
          if (parts.length >= 3) {
            return {
              amount: parts[0],
              unit: parts[1],
              name: parts.slice(2).join(' ')
            };
          } else {
            // Default if can't parse correctly
            return {
              name: value,
              amount: '1',
              unit: 'piece'
            };
          }
        }
        return value;
      });

      const parsedInstructions = Object.entries(instructions).map(([_, value]: [string, any], index) => ({
        step: index + 1,
        instruction: typeof value === 'object' && value !== null ? value.instruction : value,
      }));

      recipe.name = name || recipe.name;
      recipe.description = description || recipe.description;
      recipe.servings = parseInt(servings) || recipe.servings;
      recipe.ingredients = parsedIngredients as any;
      recipe.instructions = parsedInstructions as any;
      recipe.difficulty = difficulty;
      recipe.makingTime = makingTime || recipe.makingTime;
      recipe.category = category || recipe.category;

      await recipe.save();
      logger.info(`[INFO] Recipe data updated successfully: ${recipe._id}`);
      res.status(200).json(recipe);
    } catch (parseError) {
      logger.error(`[ERROR] Error parsing ingredients or instructions: ${parseError}`);
      res.status(400).json({ error: 'Invalid ingredients or instructions format' });
    }
  } catch (error) {
    logger.error(`[ERROR] Error updating recipe data: ${error}`);
    res.status(500).json({ error: 'Failed to update recipe data' });
  }
};

// Get recipe likes count
export const getRecipeLikes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    res.status(200).json({
      recipeId: recipe._id,
      likes: recipe.likes,
      likedBy: recipe.likedBy
    });
  } catch (error) {
    logger.error(`[ERROR] Error fetching recipe likes: ${error}`);
    res.status(500).json({ error: 'Failed to fetch recipe likes' });
  }
};

export default {
  createRecipe,
  getRecipes,
  getRecipe,
  updateRecipe,
  likeRecipe,
  unlikeRecipe,
  getRecipeLikes,
  deleteRecipe
};

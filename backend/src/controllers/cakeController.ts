import { Request, Response } from 'express';
import Cake from '../models/cakeModel';
import User from "../models/userModel";

export const addCake = async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, ingredients, image } = req.body;

  if (!name || !description || !price || !ingredients || !image) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  try {
    const cake = new Cake({
      name,
      description,
      price,
      ingredients,
      image
    });
    console.log(image);
    const savedCake = await cake.save();
    res.status(201).json(savedCake);
    console.log("Cake Added Successfully")
  } catch (err) {
    console.error('Failed to save cake:', err);
    res.status(500).json({ error: 'Failed to save cake' });
  }
};

export const deleteCakes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productIds } = req.body; // מקבל מערך של מזהי עוגות מהבקשה

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ error: "Invalid or empty productIds array" });
      return;
    }

    const result = await Cake.deleteMany({ _id: { $in: productIds } }); // מוחק את כל העוגות עם ה-IDs שנתקבלו

    if (result.deletedCount === 0) {
      res.status(404).json({ error: "No cakes found to delete" });
      return;
    }

    res.status(200).json({ message: "Cakes deleted successfully", deletedCount: result.deletedCount });
  } catch (err) {
    console.error("Error deleting cakes:", err);
    res.status(500).json({ error: "Failed to delete cakes" });
  }
};

export const updateCake = async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, ingredients, image } = req.body;

  const cakeId = req.params.id;

  try {
    const updatedCake = await Cake.findByIdAndUpdate(
      cakeId,
      {
        name,
        description,
        price,
        ingredients,
        image,
      },
      { new: true }
    );

    if (!updatedCake) {
      res.status(404).json({ error: 'Cake not found' });
      return;
    }

    res.status(200).json(updatedCake);
  } catch (err) {
    console.error('Failed to update cake:', err);
    res.status(500).json({ error: 'Failed to update cake' });
  }
};

export const getAllCakes = async (req: Request, res: Response): Promise<void> => {
  try {
    const cakes = await Cake.find();
    console.log("Fetched cakes:", cakes); // בדיקה אם השדה image קיים
    res.status(200).json(cakes);
  } catch (err) {
    console.error('Failed to fetch cakes:', err);
    res.status(500).json({ error: 'Failed to fetch cakes' });
  }
};

export const deleteCake = async (req: Request, res: Response): Promise<void> => {
  const cakeId = req.params.id;

  try {
    const deletedCake = await Cake.findByIdAndDelete(cakeId);
    if (!deletedCake) {
      res.status(404).json({ error: 'Cake not found' });
      return;
    }
    res.status(200).json({ message: 'Cake deleted successfully' });
  } catch (err) {
    console.error('Failed to delete cake:', err);
    res.status(500).json({ error: 'Failed to delete cake' });
  }
};
export const addToFavorites = async (req: Request, res: Response): Promise<void> => {
  const { userId, cakeId } = req.body;

  if (!userId || !cakeId) {
    res.status(400).json({ error: "User ID and Cake ID are required" });
    return;
  }

  try {
    // חיפוש משתמש
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // בדיקה אם העוגה כבר קיימת ברשימת המועדפים
    if (user.favorites.includes(cakeId)) {
      res.status(400).json({ error: "Cake is already in favorites" });
      return;
    }

    // הוספת העוגה למועדפים
    user.favorites.push(cakeId);
    await user.save();

    res.status(200).json({ message: "Cake added to favorites" });
  } catch (err) {
    console.error('Failed to add cake to favorites:', err);
    res.status(500).json({ error: 'Failed to add cake to favorites' });
  }
};
export const removeFromFavorites = async (req: Request, res: Response): Promise<void> => {
  const { userId, cakeId } = req.body;

  if (!userId || !cakeId) {
    res.status(400).json({ error: "User ID and Cake ID are required" });
    return;
  }

  try {
    // חיפוש משתמש
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // הסרת העוגה מהמועדפים
    const index = user.favorites.indexOf(cakeId);
    if (index === -1) {
      res.status(400).json({ error: "Cake not in favorites" });
      return;
    }

    // הסרת העוגה
    user.favorites.splice(index, 1);
    await user.save();

    res.status(200).json({ message: "Cake removed from favorites" });
  } catch (err) {
    console.error('Failed to remove cake from favorites:', err);
    res.status(500).json({ error: 'Failed to remove cake from favorites' });
  }
};


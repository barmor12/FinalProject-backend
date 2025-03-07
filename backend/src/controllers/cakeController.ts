import { Request, Response } from 'express';
import Cake from '../models/cakeModel';
import User from "../models/userModel";

export const addCake = async (req: Request, res: Response): Promise<void> => {
<<<<<<< HEAD
  const { name, description, price, ingredients, image } = req.body;
=======
  const { name, description, price, ingredients, imagePath } = req.body;
>>>>>>> 64aa23f69db82b76117c0eef0b9fb2f85d3daa3e

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
<<<<<<< HEAD
      image
=======
      imagePath
>>>>>>> 64aa23f69db82b76117c0eef0b9fb2f85d3daa3e
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

export const updateCake = async (req: Request, res: Response): Promise<void> => {
<<<<<<< HEAD
  const { name, description, price, ingredients, image } = req.body;
=======
  const { name, description, price, ingredients } = req.body;
>>>>>>> 64aa23f69db82b76117c0eef0b9fb2f85d3daa3e
  const cakeId = req.params.id;

  try {
    const updatedCake = await Cake.findByIdAndUpdate(
      cakeId,
      {
        name,
        description,
        price,
        ingredients,
<<<<<<< HEAD
        image,
=======
        image: req.file ? `/uploads/${req.file.filename}` : undefined,
>>>>>>> 64aa23f69db82b76117c0eef0b9fb2f85d3daa3e
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
<<<<<<< HEAD
    console.log("Fetched cakes:", cakes); // בדיקה אם השדה image קיים
    res.status(200).json(cakes);

=======
    res.status(200).json(cakes);
>>>>>>> 64aa23f69db82b76117c0eef0b9fb2f85d3daa3e
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


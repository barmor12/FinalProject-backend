import { Request, Response } from 'express';
import Cake from '../models/cakeModel';
import User from '../models/userModel';
import cloudinary from '../config/cloudinary';

export const addCake = async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, cost, ingredients, stock, imageUrl } = req.body;
  console.log('body: ', req.body);

  // Check required fields
  if (!name || !description || !price || !cost || !ingredients) {
    res.status(400).json({ error: 'Name, description, price, cost, and ingredients are required' });
    return;
  }

  // Validate cost and price
  const costValue = parseFloat(cost);
  const priceValue = parseFloat(price);

  if (isNaN(costValue) || isNaN(priceValue)) {
    res.status(400).json({ error: 'Cost and price must be valid numbers' });
    return;
  }

  if (costValue >= priceValue) {
    res.status(400).json({ error: 'Price must be higher than cost' });
    return;
  }

  try {
    let imageData = null;

    // Handle image: either from file upload or URL in request body
    if (req.file) {
      // If image is uploaded via form
      const uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: 'cakes' });
      imageData = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      };
    } else if (imageUrl) {
      // If image URL is provided in request body
      imageData = {
        url: imageUrl,
        public_id: `direct_url_${Date.now()}` // Create a pseudo ID for direct URLs
      };
    } else {
      // No image provided
      res.status(400).json({ error: 'Image file or image URL is required' });
      return;
    }

    const cake = new Cake({
      name,
      description,
      cost: costValue,
      price: priceValue,
      ingredients,
      image: imageData,
      stock,
    });

    const savedCake = await cake.save();
    res.status(201).json(savedCake);
  } catch (err) {
    console.error('Failed to save cake:', err);
    res.status(500).json({ error: 'Failed to save cake' });
  }
};

export const updateCake = async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, cost, ingredients, stock } = req.body;
  const cakeId = req.params.id;

  try {
    const cake = await Cake.findById(cakeId);
    if (!cake) {
      res.status(404).json({ error: 'Cake not found' });
      return;
    }

    // Validate cost and price if they are being updated
    if (cost !== undefined || price !== undefined) {
      const costValue = cost !== undefined ? parseFloat(cost) : cake.cost;
      const priceValue = price !== undefined ? parseFloat(price) : cake.price;

      if (isNaN(costValue) || isNaN(priceValue)) {
        res.status(400).json({ error: 'Cost and price must be valid numbers' });
        return;
      }

      if (costValue >= priceValue) {
        res.status(400).json({ error: 'Price must be higher than cost' });
        return;
      }
    }

    if (req.file) {
      if (cake.image?.public_id) {
        await cloudinary.uploader.destroy(cake.image.public_id);
      }
      const uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: 'cakes' });
      cake.image = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      };
    }

    cake.name = name || cake.name;
    cake.description = description || cake.description;
    cake.price = price !== undefined ? parseFloat(price) : cake.price;
    cake.cost = cost !== undefined ? parseFloat(cost) : cake.cost;
    cake.ingredients = ingredients || cake.ingredients;
    cake.stock = stock !== undefined ? parseInt(stock) : cake.stock;

    const updatedCake = await cake.save();
    res.status(200).json(updatedCake);
  } catch (err) {
    console.error('Failed to update cake:', err);
    res.status(500).json({ error: 'Failed to update cake' });
  }
};

export const getAllCakes = async (req: Request, res: Response): Promise<void> => {
  try {
    const cakes = await Cake.find();
    res.status(200).json(cakes);
  } catch (err) {
    console.error('Failed to fetch cakes:', err);
    res.status(500).json({ error: 'Failed to fetch cakes' });
  }
};

export const deleteCake = async (req: Request, res: Response): Promise<void> => {
  const cakeId = req.params.id;

  try {
    const cake = await Cake.findById(cakeId);
    if (!cake) {
      res.status(404).json({ error: 'Cake not found' });
      return;
    }

    if (cake.image?.public_id) {
      await cloudinary.uploader.destroy(cake.image.public_id);
    }

    await Cake.findByIdAndDelete(cakeId);
    res.status(200).json({ message: 'Cake deleted successfully' });
  } catch (err) {
    console.error('Failed to delete cake:', err);
    res.status(500).json({ error: 'Failed to delete cake' });
  }
};
export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  try {
    const user = await User.findById(userId).populate('favorites');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};
export const addToFavorites = async (req: Request, res: Response): Promise<void> => {
  const { userId, cakeId } = req.body;
  if (!userId || !cakeId) {
    res.status(400).json({ error: 'User ID and Cake ID are required' });
    return;
  }

  try {
    // חיפוש משתמש
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // בדיקה אם העוגה כבר קיימת ברשימת המועדפים
    if (user.favorites.includes(cakeId)) {
      res.status(400).json({ error: 'Cake is already in favorites' });
      return;
    }

    // הוספת העוגה למועדפים
    user.favorites.push(cakeId);
    await user.save();

    res.status(200).json({ message: 'Cake added to favorites' });
  } catch (err) {
    console.error('Failed to add cake to favorites:', err);
    res.status(500).json({ error: 'Failed to add cake to favorites' });
  }
};
export const removeFromFavorites = async (req: Request, res: Response): Promise<void> => {
  const { userId, cakeId } = req.body;

  if (!userId || !cakeId) {
    res.status(400).json({ error: 'User ID and Cake ID are required' });
    return;
  }

  try {
    // חיפוש משתמש
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // הסרת העוגה מהמועדפים
    const index = user.favorites.indexOf(cakeId);
    if (index === -1) {
      res.status(400).json({ error: 'Cake not in favorites' });
      return;
    }

    // הסרת העוגה
    user.favorites.splice(index, 1);
    await user.save();

    res.status(200).json({ message: 'Cake removed from favorites' });
  } catch (err) {
    console.error('Failed to remove cake from favorites:', err);
    res.status(500).json({ error: 'Failed to remove cake from favorites' });
  }
};

// פונקציה לעדכון מלאי של עוגה
export const updateStock = async (req: Request, res: Response) => {
  try {
    const { stock } = req.body;
    const cake = await Cake.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true } // מחזירים את העוגה אחרי העדכון
    );

    if (!cake) {
      res.status(404).json({ message: 'Cake not found' });
      return;
    }

    res.status(200).json(cake);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

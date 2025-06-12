import { Request, Response } from 'express';
import Product from '../models/inventoryModel';
import Cake from '../models/cakeModel';
import cloudinary from '../config/cloudinary';

export const getAllProducts = async (req: Request, res: Response) => {
  const products = await Product.find();
  console.log(products);
  res.json({ products });
};

export const updateProduct = async (req: Request, res: Response) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updatedProduct);
};


// מחיקת מוצר כולל תמונה
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cakeId } = req.params;
    console.log(cakeId);

    // חיפוש המוצר במסד הנתונים
    const cake = await Cake.findById(cakeId);
    if (!cake) {
      res.status(404).json({ error: 'Product not found' });
      return; // ✅ עצירת המשך הקוד אם המוצר לא נמצא
    }

    // מחיקת התמונה מ-Cloudinary אם קיימת
    if (cake.image && cake.image.public_id) {
      await cloudinary.uploader.destroy(cake.image.public_id);
      console.log(`🗑️ Image deleted: ${cake.image.public_id}`);
    }

    // מחיקת המוצר מהמסד נתונים
    await Cake.findByIdAndDelete(cakeId);

    res.json({ success: true, message: 'Product and image deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};



export const deleteProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 Received Request Body:', req.body); // הדפסת תוכן הבקשה

    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ error: 'Invalid productIds array' });
      return;
    }

    console.log('✅ Valid productIds:', productIds);

    // חיפוש המוצרים במסד הנתונים
    const cakes = await Cake.find({ _id: { $in: productIds } });

    console.log('🎂 Cakes found:', cakes);

    if (cakes.length === 0) {
      res.status(404).json({ error: 'No products found' });
      return;
    }

    // מחיקת התמונות מ-Cloudinary
    await Promise.all(
      cakes.map(async (cake) => {
        if (cake.image && cake.image.public_id) {
          await cloudinary.uploader.destroy(cake.image.public_id);
          console.log(`🗑️ Image deleted: ${cake.image.public_id}`);
        }
      })
    );

    // מחיקת המוצרים מהמסד נתונים
    await Cake.deleteMany({ _id: { $in: productIds } });

    res.json({ success: true, message: 'Products deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting products:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

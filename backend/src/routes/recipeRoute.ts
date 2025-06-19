import express from 'express';
import multer from 'multer';
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipe,
  updateRecipeData,
  unlikeRecipe,
  likeRecipe,
  getRecipeLikes,
} from '../controllers/recipeController';
import authenticateMiddleware from '../common/authMiddleware';
import authenticateAdminMiddleware from '../common/authAdminMiddleware';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', authenticateMiddleware, getRecipes);
router.get('/:id', authenticateMiddleware, getRecipe);

router.post('/newRecipe', authenticateAdminMiddleware, upload.single('image'), (req, res) => {
  createRecipe(req, res).catch(err => {
    console.error('Unhandled error in createRecipe:', err);
    res.status(500).json({ error: 'Unhandled error in createRecipe' });
  });
});



router.put(
  '/:id/withImage',
  authenticateAdminMiddleware,
  upload.single('image'),
  (req, res) => {
    updateRecipe(req, res).catch(err => {
      console.error('Unhandled error in updateRecipe:', err);
      res.status(500).json({ error: 'Unhandled error in updateRecipe' });
    });
  }
);
router.put(
  '/:id',
  authenticateAdminMiddleware,
  updateRecipeData
);
router.delete('/:id', authenticateAdminMiddleware, deleteRecipe);

router.put('/:id/like', authenticateMiddleware, likeRecipe);
router.put('/:id/unlike', authenticateMiddleware, unlikeRecipe);
router.get('/:id/likes', getRecipeLikes);
export default router;

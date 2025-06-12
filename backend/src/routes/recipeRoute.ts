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

router.post('/newRecipe', authenticateAdminMiddleware, upload.single('image'), createRecipe);

router.put(
  '/:id/withImage',
  authenticateAdminMiddleware,
  upload.single('image'),
  updateRecipe
);
router.put(
  '/:id',
  authenticateAdminMiddleware,
  updateRecipeData
);
router.delete('/:id', authenticateAdminMiddleware, deleteRecipe);

router.post('/:id/like', authenticateMiddleware, likeRecipe);
router.post('/:id/unlike', authenticateMiddleware, unlikeRecipe);
router.get('/:id/likes', getRecipeLikes);
export default router;

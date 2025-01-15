import express from "express";
import multer from "multer";
import {
  getAllRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeById,
} from "../controllers/recipeController";
import authenticateMiddleware from "../common/authMiddleware";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/", getAllRecipes);
router.get("/:id", getRecipeById);

router.post("/newRecipe", addRecipe);
router.post("/", authenticateMiddleware, upload.single("image"), addRecipe);

router.put(
  "/:id",
  authenticateMiddleware,
  upload.single("image"),
  updateRecipe
);
router.delete("/:id", authenticateMiddleware, deleteRecipe);

export default router;

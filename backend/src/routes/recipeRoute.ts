import express from "express";
import multer from "multer";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipe,
} from "../controllers/recipeController";
import authenticateMiddleware from "../common/authMiddleware";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/", getRecipes);
router.get("/:id", getRecipe);

router.post("/", authenticateMiddleware, upload.single("image"), createRecipe);

router.put(
  "/:id",
  authenticateMiddleware,
  upload.single("image"),
  updateRecipe
);
router.delete("/:id", authenticateMiddleware, deleteRecipe);

export default router;

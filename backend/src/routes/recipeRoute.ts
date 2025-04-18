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
import authenticateAdminMiddleware from "../common/authAdminMiddleware";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/", authenticateMiddleware, getRecipes);
router.get("/:id", getRecipe);

router.post("/newRecipe", authenticateAdminMiddleware, upload.single("image"), createRecipe);

router.put(
  "/:id",
  authenticateAdminMiddleware,
  upload.single("image"),
  updateRecipe
);
router.delete("/:id", authenticateAdminMiddleware, deleteRecipe);

export default router;

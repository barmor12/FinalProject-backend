import express from "express";
import { createRecipe, getRecipes, getRecipe, updateRecipe, deleteRecipe } from "../controllers/recipeController";
import authenticateMiddleware from "../common/authMiddleware";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Public routes
router.get("/", getRecipes);
router.get("/:id", getRecipe);

// Protected routes - require authentication
router.post("/", authenticateMiddleware, upload.single("image"), createRecipe);
router.put("/:id", authenticateMiddleware, upload.single("image"), updateRecipe);
router.delete("/:id", authenticateMiddleware, deleteRecipe);

export default router; 
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecipeById = exports.deleteRecipe = exports.updateRecipe = exports.addRecipe = exports.getAllRecipes = void 0;
const recipeModel_1 = __importDefault(require("../models/recipeModel"));
const getAllRecipes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recipes = yield recipeModel_1.default.find().populate("user", "nickname");
        res.status(200).json(recipes);
    }
    catch (err) {
        console.error("Failed to fetch recipes:", err);
        res.status(500).json({ error: "Failed to fetch recipes" });
    }
});
exports.getAllRecipes = getAllRecipes;
const addRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, ingredients, instructions, userId } = req.body;
    if (!title || !description || !ingredients || !instructions || !userId) {
        res.status(400).json({ error: "All fields are required" });
        return;
    }
    try {
        const recipe = new recipeModel_1.default({
            title,
            description,
            ingredients: ingredients.split(","),
            instructions: instructions.split(","),
            user: userId,
            image: req.file ? `/uploads/${req.file.filename}` : undefined,
        });
        const savedRecipe = yield recipe.save();
        res.status(201).json(savedRecipe);
    }
    catch (err) {
        console.error("Failed to save recipe:", err);
        res.status(500).json({ error: "Failed to save recipe" });
    }
});
exports.addRecipe = addRecipe;
const updateRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, ingredients, instructions } = req.body;
    const recipeId = req.params.id;
    try {
        const updatedRecipe = yield recipeModel_1.default.findByIdAndUpdate(recipeId, {
            title,
            ingredients: ingredients === null || ingredients === void 0 ? void 0 : ingredients.split(","),
            instructions,
            image: req.file ? `/uploads/${req.file.filename}` : undefined,
        }, { new: true });
        if (!updatedRecipe) {
            res.status(404).json({ error: "Recipe not found" });
            return;
        }
        res.status(200).json(updatedRecipe);
    }
    catch (err) {
        console.error("Failed to update recipe:", err);
        res.status(500).json({ error: "Failed to update recipe" });
    }
});
exports.updateRecipe = updateRecipe;
const deleteRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const recipeId = req.params.id;
    try {
        const deletedRecipe = yield recipeModel_1.default.findByIdAndDelete(recipeId);
        if (!deletedRecipe) {
            res.status(404).json({ error: "Recipe not found" });
            return;
        }
        res.status(200).json({ message: "Recipe deleted successfully" });
    }
    catch (err) {
        console.error("Failed to delete recipe:", err);
        res.status(500).json({ error: "Failed to delete recipe" });
    }
});
exports.deleteRecipe = deleteRecipe;
const getRecipeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const recipeId = req.params.id;
    try {
        const recipe = yield recipeModel_1.default.findById(recipeId).populate("createdBy", "nickname");
        if (!recipe) {
            res.status(404).json({ error: "Recipe not found" });
            return;
        }
        res.status(200).json(recipe);
    }
    catch (err) {
        console.error("Failed to fetch recipe:", err);
        res.status(500).json({ error: "Failed to fetch recipe" });
    }
});
exports.getRecipeById = getRecipeById;
//# sourceMappingURL=recipeController.js.map
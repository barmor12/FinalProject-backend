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
exports.getRecipeLikes = exports.updateRecipeData = exports.deleteRecipe = exports.unlikeRecipe = exports.likeRecipe = exports.updateRecipe = exports.getRecipe = exports.getRecipes = exports.createRecipe = void 0;
const recipeModel_1 = __importDefault(require("../models/recipeModel"));
const logger_1 = __importDefault(require("../logger"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, servings, ingredients, instructions, difficulty, makingTime, } = req.body;
        if (!name || !description || !servings || !ingredients || !instructions || !difficulty || !makingTime) {
            res.status(400).json({ error: "All fields are required" });
            return;
        }
        if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
            res.status(400).json({ error: "Difficulty must be one of: Easy, Medium, Hard" });
            return;
        }
        const parsedIngredients = Object.entries(JSON.parse(ingredients)).map(([_, value]) => value);
        const parsedInstructions = Object.entries(JSON.parse(instructions)).map(([_, value], index) => ({
            step: index + 1,
            instruction: typeof value === 'object' ? value.instruction : value
        }));
        let imageData;
        if (req.file) {
            const result = yield cloudinary_1.default.uploader.upload(req.file.path, {
                folder: "recipes",
            });
            imageData = {
                url: result.secure_url,
                public_id: result.public_id,
            };
        }
        else {
            res.status(400).json({ error: "Recipe image is required" });
            return;
        }
        const recipe = new recipeModel_1.default({
            name,
            description,
            servings: parseInt(servings),
            difficulty,
            makingTime,
            image: imageData,
            ingredients: parsedIngredients,
            instructions: parsedInstructions,
            likes: 0,
            likedBy: []
        });
        yield recipe.save();
        logger_1.default.info(`[INFO] Recipe created successfully: ${recipe._id}`);
        res.status(201).json(recipe);
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Error creating recipe: ${error}`);
        res.status(500).json({ error: "Failed to create recipe" });
    }
});
exports.createRecipe = createRecipe;
const getRecipes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recipes = yield recipeModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(recipes);
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Error fetching recipes: ${error}`);
        res.status(500).json({ error: "Failed to fetch recipes" });
    }
});
exports.getRecipes = getRecipes;
const getRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recipe = yield recipeModel_1.default.findById(req.params.id);
        if (!recipe) {
            res.status(404).json({ error: "Recipe not found" });
            return;
        }
        res.status(200).json(recipe);
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Error fetching recipe: ${error}`);
        res.status(500).json({ error: "Failed to fetch recipe" });
    }
});
exports.getRecipe = getRecipe;
const updateRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, servings, ingredients, directions, difficulty, makingTime } = req.body;
        const recipe = yield recipeModel_1.default.findById(req.params.id);
        if (!recipe) {
            res.status(404).json({ error: "Recipe not found" });
            return;
        }
        if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
            res.status(400).json({ error: "Difficulty must be one of: Easy, Medium, Hard" });
            return;
        }
        if (!makingTime) {
            recipe.makingTime = "";
        }
        if (req.file && recipe.image) {
            yield cloudinary_1.default.uploader.destroy(recipe.image.public_id);
            const result = yield cloudinary_1.default.uploader.upload(req.file.path, {
                folder: "recipes"
            });
            recipe.image = {
                url: result.secure_url,
                public_id: result.public_id
            };
        }
        recipe.name = name || recipe.name;
        recipe.description = description || recipe.description;
        recipe.servings = servings || recipe.servings;
        recipe.difficulty = difficulty || recipe.difficulty;
        recipe.ingredients = ingredients || recipe.ingredients;
        recipe.instructions = directions || recipe.instructions;
        yield recipe.save();
        logger_1.default.info(`[INFO] Recipe updated successfully: ${recipe._id}`);
        res.status(200).json(recipe);
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Error updating recipe: ${error}`);
        res.status(500).json({ error: "Failed to update recipe" });
    }
});
exports.updateRecipe = updateRecipe;
const likeRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Authorization token is required" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;
        if (!userId) {
            res.status(401).json({ error: "Invalid token - user ID not found" });
            return;
        }
        const recipe = yield recipeModel_1.default.findById(id);
        if (!recipe) {
            res.status(404).json({ error: "Recipe not found" });
            return;
        }
        const userIdObj = new mongoose_1.default.Types.ObjectId(userId);
        const alreadyLiked = recipe.likedBy.some(id => id.equals(userIdObj));
        if (alreadyLiked) {
            res.status(400).json({ error: "You already liked this recipe" });
            return;
        }
        recipe.likedBy.push(userIdObj);
        recipe.likes += 1;
        yield recipe.save();
        logger_1.default.info(`[INFO] Recipe liked successfully: ${recipe._id} by user: ${userId}`);
        res.status(200).json({
            message: "Recipe liked successfully",
            likes: recipe.likes
        });
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Error liking recipe: ${error}`);
        res.status(500).json({ error: "Failed to like recipe" });
    }
});
exports.likeRecipe = likeRecipe;
const unlikeRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Authorization token is required" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;
        if (!userId) {
            res.status(401).json({ error: "Invalid token - user ID not found" });
            return;
        }
        const recipe = yield recipeModel_1.default.findById(id);
        if (!recipe) {
            res.status(404).json({ error: "Recipe not found" });
            return;
        }
        const userIdObj = new mongoose_1.default.Types.ObjectId(userId);
        const likedIndex = recipe.likedBy.findIndex(id => id.equals(userIdObj));
        if (likedIndex === -1) {
            res.status(400).json({ error: "You haven't liked this recipe yet" });
            return;
        }
        recipe.likedBy.splice(likedIndex, 1);
        recipe.likes = Math.max(0, recipe.likes - 1);
        yield recipe.save();
        logger_1.default.info(`[INFO] Recipe unliked successfully: ${recipe._id} by user: ${userId}`);
        res.status(200).json({
            message: "Recipe unliked successfully",
            likes: recipe.likes
        });
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Error unliking recipe: ${error}`);
        res.status(500).json({ error: "Failed to unlike recipe" });
    }
});
exports.unlikeRecipe = unlikeRecipe;
const deleteRecipe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recipe = yield recipeModel_1.default.findById(req.params.id);
        if (!recipe) {
            res.status(404).json({ error: "Recipe not found" });
            return;
        }
        if (recipe.image) {
            yield cloudinary_1.default.uploader.destroy(recipe.image.public_id);
        }
        yield recipe.deleteOne();
        logger_1.default.info(`[INFO] Recipe deleted successfully: ${recipe._id}`);
        res.status(200).json({ message: "Recipe deleted successfully" });
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Error deleting recipe: ${error}`);
        res.status(500).json({ error: "Failed to delete recipe" });
    }
});
exports.deleteRecipe = deleteRecipe;
const updateRecipeData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, servings, ingredients, instructions, difficulty, makingTime, } = req.body;
        const recipe = yield recipeModel_1.default.findById(req.params.id);
        if (!recipe) {
            res.status(404).json({ error: "Recipe not found" });
            return;
        }
        if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
            res.status(400).json({ error: "Difficulty must be one of: Easy, Medium, Hard" });
            return;
        }
        try {
            const parsedIngredients = Object.entries(ingredients).map(([_, value]) => {
                if (typeof value === 'string') {
                    const parts = value.trim().split(' ');
                    if (parts.length >= 3) {
                        return {
                            amount: parts[0],
                            unit: parts[1],
                            name: parts.slice(2).join(' ')
                        };
                    }
                    else {
                        return {
                            name: value,
                            amount: "1",
                            unit: "piece"
                        };
                    }
                }
                return value;
            });
            const parsedInstructions = Object.entries(instructions).map(([_, value], index) => ({
                step: index + 1,
                instruction: typeof value === 'object' && value !== null ? value.instruction : value,
            }));
            recipe.name = name || recipe.name;
            recipe.description = description || recipe.description;
            recipe.servings = parseInt(servings) || recipe.servings;
            recipe.ingredients = parsedIngredients;
            recipe.instructions = parsedInstructions;
            recipe.difficulty = difficulty;
            recipe.makingTime = makingTime || recipe.makingTime;
            yield recipe.save();
            logger_1.default.info(`[INFO] Recipe data updated successfully: ${recipe._id}`);
            res.status(200).json(recipe);
        }
        catch (parseError) {
            logger_1.default.error(`[ERROR] Error parsing ingredients or instructions: ${parseError}`);
            res.status(400).json({ error: "Invalid ingredients or instructions format" });
        }
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Error updating recipe data: ${error}`);
        res.status(500).json({ error: "Failed to update recipe data" });
    }
});
exports.updateRecipeData = updateRecipeData;
const getRecipeLikes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const recipe = yield recipeModel_1.default.findById(id);
        if (!recipe) {
            res.status(404).json({ error: "Recipe not found" });
            return;
        }
        res.status(200).json({
            recipeId: recipe._id,
            likes: recipe.likes,
            likedBy: recipe.likedBy
        });
    }
    catch (error) {
        logger_1.default.error(`[ERROR] Error fetching recipe likes: ${error}`);
        res.status(500).json({ error: "Failed to fetch recipe likes" });
    }
});
exports.getRecipeLikes = getRecipeLikes;
exports.default = {
    createRecipe: exports.createRecipe,
    getRecipes: exports.getRecipes,
    getRecipe: exports.getRecipe,
    updateRecipe: exports.updateRecipe,
    likeRecipe: exports.likeRecipe,
    unlikeRecipe: exports.unlikeRecipe,
    getRecipeLikes: exports.getRecipeLikes,
    deleteRecipe: exports.deleteRecipe
};
//# sourceMappingURL=recipeController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const recipeController_1 = require("../controllers/recipeController");
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: "uploads/" });
router.get("/", recipeController_1.getAllRecipes);
router.get("/:id", recipeController_1.getRecipeById);
router.post("/", authMiddleware_1.default, upload.single("image"), recipeController_1.addRecipe);
router.put("/:id", authMiddleware_1.default, upload.single("image"), recipeController_1.updateRecipe);
router.delete("/:id", authMiddleware_1.default, recipeController_1.deleteRecipe);
exports.default = router;
//# sourceMappingURL=recipeRoute.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const recipeController_1 = require("../controllers/recipeController");
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const authAdminMiddleware_1 = __importDefault(require("../common/authAdminMiddleware"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: "uploads/" });
router.get("/", authMiddleware_1.default, recipeController_1.getRecipes);
router.get("/:id", authMiddleware_1.default, recipeController_1.getRecipe);
router.post("/newRecipe", authAdminMiddleware_1.default, upload.single("image"), recipeController_1.createRecipe);
router.put("/:id/withImage", authAdminMiddleware_1.default, upload.single("image"), recipeController_1.updateRecipe);
router.put("/:id", authAdminMiddleware_1.default, recipeController_1.updateRecipeData);
router.delete("/:id", authAdminMiddleware_1.default, recipeController_1.deleteRecipe);
router.post("/:id/like", authMiddleware_1.default, recipeController_1.likeRecipe);
router.post("/:id/unlike", authMiddleware_1.default, recipeController_1.unlikeRecipe);
router.get("/:id/likes", recipeController_1.getRecipeLikes);
exports.default = router;
//# sourceMappingURL=recipeRoute.js.map
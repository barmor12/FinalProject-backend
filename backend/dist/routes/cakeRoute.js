"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cakeController_1 = require("../controllers/cakeController");
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
router.post("/addcake", upload.single('image'), cakeController_1.addCake);
router.put("/:id", authMiddleware_1.default, upload.single('image'), cakeController_1.updateCake);
router.get("/", cakeController_1.getAllCakes);
router.post("/favorites", authMiddleware_1.default, cakeController_1.addToFavorites);
router.get("/favorites/:userId", cakeController_1.getFavorites);
router.delete("/favorites", authMiddleware_1.default, cakeController_1.removeFromFavorites);
router.delete("/:id", authMiddleware_1.default, cakeController_1.deleteCake);
router.put('/cakes/:id/update-stock', cakeController_1.updateStock);
exports.default = router;
//# sourceMappingURL=cakeRoute.js.map
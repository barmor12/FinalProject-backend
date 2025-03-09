"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cakeController_1 = require("../controllers/cakeController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    dest: path_1.default.join(__dirname, "..", "uploads"),
});
router.post("/addcake", authMiddleware_1.default, upload.single("image"), cakeController_1.addCake);
router.put("/:id", authMiddleware_1.default, upload.single("image"), cakeController_1.updateCake);
router.get("/", cakeController_1.getAllCakes);
router.delete("/:id", authMiddleware_1.default, cakeController_1.deleteCake);
router.post("/favorites", authMiddleware_1.default, cakeController_1.addToFavorites);
router.delete("/favorites", authMiddleware_1.default, cakeController_1.removeFromFavorites);
exports.default = router;
//# sourceMappingURL=cakeRoute.js.map
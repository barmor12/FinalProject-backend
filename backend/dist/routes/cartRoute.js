"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cartController_1 = __importDefault(require("../controllers/cartController"));
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const router = express_1.default.Router();
router.post("/add", authMiddleware_1.default, cartController_1.default.addToCart);
router.get("/", authMiddleware_1.default, cartController_1.default.getCart);
router.delete("/remove", authMiddleware_1.default, cartController_1.default.removeFromCart);
router.delete("/clear", authMiddleware_1.default, cartController_1.default.clearCart);
exports.default = router;
//# sourceMappingURL=cartRoute.js.map
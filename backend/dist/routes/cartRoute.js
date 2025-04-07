"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cartController_1 = __importDefault(require("../controllers/cartController"));
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const router = express_1.default.Router();
router.use(authMiddleware_1.default);
router.post("/add", cartController_1.default.addToCart);
router.get("/", cartController_1.default.getCart);
router.delete("/remove", cartController_1.default.removeFromCart);
router.delete("/clear", cartController_1.default.clearCart);
router.post("/update", cartController_1.default.updateCartItem);
exports.default = router;
//# sourceMappingURL=cartRoute.js.map
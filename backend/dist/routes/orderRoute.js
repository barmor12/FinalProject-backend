"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ordersController_1 = require("../controllers/ordersController");
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const multerMiddleware_1 = __importDefault(require("../common/multerMiddleware"));
const ordersController_2 = require("../controllers/ordersController");
const router = express_1.default.Router();
router.post("/new-order", authMiddleware_1.default, multerMiddleware_1.default.single("image"), ordersController_1.placeOrder);
router.get("/orders", authMiddleware_1.default, ordersController_1.getAllOrders);
router.post("/draft", authMiddleware_1.default, multerMiddleware_1.default.single("image"), ordersController_1.saveDraftOrder);
router.post("/duplicate", authMiddleware_1.default, ordersController_1.duplicateOrder);
router.post("/apply-discount", authMiddleware_1.default, ordersController_1.applyDiscountCode);
router.post("/check-date", authMiddleware_1.default, ordersController_1.checkDeliveryDate);
router.post("/validate", authMiddleware_1.default, ordersController_1.validateOrderInput);
router.get("/", authMiddleware_1.default, ordersController_2.getDecorations);
exports.default = router;
//# sourceMappingURL=orderRoute.js.map
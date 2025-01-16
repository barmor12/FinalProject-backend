"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ordersController_1 = require("../controllers/ordersController");
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const authAdminMiddleware_1 = __importDefault(require("../common/authAdminMiddleware"));
const router = express_1.default.Router();
router.post('/new-order', authMiddleware_1.default, ordersController_1.placeOrder);
router.get('/orders', authAdminMiddleware_1.default, ordersController_1.getAllOrders);
exports.default = router;
//# sourceMappingURL=orderRoute.js.map
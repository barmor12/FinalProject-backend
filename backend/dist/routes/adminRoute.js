"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const authAdminMiddleware_1 = __importDefault(require("../common/authAdminMiddleware"));
const router = express_1.default.Router();
router.get("/stats", authAdminMiddleware_1.default, adminController_1.getStats);
router.get("/orders", authAdminMiddleware_1.default, adminController_1.getAllOrders);
router.put("/orders/:orderId", authAdminMiddleware_1.default, adminController_1.updateOrder);
router.get("/users", authAdminMiddleware_1.default, adminController_1.getAllUsers);
router.put("/users/:userId", authAdminMiddleware_1.default, adminController_1.updateUser);
router.get("/users/:userId", authAdminMiddleware_1.default, adminController_1.getUserById);
exports.default = router;
//# sourceMappingURL=adminRoute.js.map
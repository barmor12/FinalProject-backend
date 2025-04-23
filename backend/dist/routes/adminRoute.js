"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const authAdminMiddleware_1 = __importDefault(require("../common/authAdminMiddleware"));
const router = express_1.default.Router();
router.use(authAdminMiddleware_1.default);
router.get("/orders", adminController_1.getAllOrders);
router.put("/orders/:orderId", adminController_1.updateOrder);
router.put("/orders/:orderId/priority", adminController_1.toggleOrderPriority);
router.get("/users", adminController_1.getAllUsers);
router.get("/users/:userId", adminController_1.getUserById);
router.put("/users/:userId", adminController_1.updateUser);
router.get("/stats", adminController_1.getStats);
exports.default = router;
//# sourceMappingURL=adminRoute.js.map
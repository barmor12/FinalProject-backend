"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const discountController_1 = require("../controllers/discountController");
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const authAdminMiddleware_1 = __importDefault(require("../common/authAdminMiddleware"));
const router = express_1.default.Router();
router.post("/", authMiddleware_1.default, authAdminMiddleware_1.default, discountController_1.createDiscountCode);
router.get("/", authMiddleware_1.default, authAdminMiddleware_1.default, discountController_1.getAllDiscountCodes);
router.post("/validate", discountController_1.validateDiscountCode);
router.delete("/:id", authMiddleware_1.default, authAdminMiddleware_1.default, discountController_1.deleteDiscountCode);
exports.default = router;
//# sourceMappingURL=discountRoute.js.map
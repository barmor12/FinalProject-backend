"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authAdminMiddleware_1 = __importDefault(require("../common/authAdminMiddleware"));
const emailController_1 = require("../controllers/emailController");
const router = express_1.default.Router();
router.post("/:userId/message", authAdminMiddleware_1.default, emailController_1.sendEmailToUser);
router.delete("delete/:id", authAdminMiddleware_1.default, emailController_1.deleteUserWithEmail);
exports.default = router;
//# sourceMappingURL=emailRoute.js.map
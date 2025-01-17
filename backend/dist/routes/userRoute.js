"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: "uploads/" });
router.get("/profile", authMiddleware_1.default, userController_1.getProfile);
router.put("/profile", authMiddleware_1.default, upload.single("profilePic"), userController_1.updateProfile);
exports.default = router;
//# sourceMappingURL=userRoute.js.map
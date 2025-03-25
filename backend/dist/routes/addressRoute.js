"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const addressController_1 = require("../controllers/addressController");
const authMiddleware_1 = __importDefault(require("../common/authMiddleware"));
const router = express_1.default.Router();
router.get("/", authMiddleware_1.default, addressController_1.getUserAddresses);
router.post("/", authMiddleware_1.default, addressController_1.addAddress);
router.put("/:id", authMiddleware_1.default, addressController_1.updateAddress);
router.delete("/:id", authMiddleware_1.default, addressController_1.deleteAddress);
router.put("/default/:addressId", addressController_1.setDefaultAddress);
exports.default = router;
//# sourceMappingURL=addressRoute.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const inventoryController_1 = require("../controllers/inventoryController");
const router = express_1.default.Router();
router.get("/", inventoryController_1.getAllProducts);
router.put("/:id", inventoryController_1.updateProduct);
router.delete("/bulk-delete", inventoryController_1.deleteProducts);
router.delete("/:cakeId", inventoryController_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=inventoryRoutes.js.map
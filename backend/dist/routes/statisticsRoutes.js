"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const statisticsController_1 = require("../controllers/statisticsController");
const authAdminMiddleware_1 = __importDefault(require("../common/authAdminMiddleware"));
const router = express_1.default.Router();
router.get("/", authAdminMiddleware_1.default, statisticsController_1.getStatistics);
exports.default = router;
//# sourceMappingURL=statisticsRoutes.js.map
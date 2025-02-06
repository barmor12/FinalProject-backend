"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getAllProducts = void 0;
const inventoryModel_1 = __importDefault(require("../models/inventoryModel"));
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield inventoryModel_1.default.find();
    res.json({ products });
});
exports.getAllProducts = getAllProducts;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedProduct = yield inventoryModel_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield inventoryModel_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
});
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=inventoryController.js.map
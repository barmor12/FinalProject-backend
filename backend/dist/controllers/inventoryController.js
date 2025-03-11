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
exports.deleteProducts = exports.deleteProduct = exports.updateProduct = exports.getAllProducts = void 0;
const inventoryModel_1 = __importDefault(require("../models/inventoryModel"));
const cakeModel_1 = __importDefault(require("../models/cakeModel"));
const admin = require("firebase-admin");
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
const bucket = admin.storage().bucket();
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { cakeId } = req.params;
        console.log(cakeId);
        const cake = yield cakeModel_1.default.findById(cakeId);
        if (!cake) {
            res.status(404).json({ error: "Product not found" });
            return;
        }
        if (cake.image) {
            const imageName = (_a = cake.image.split("%2F")[1]) === null || _a === void 0 ? void 0 : _a.split("?")[0];
            if (imageName) {
                const file = bucket.file(`cakes/${imageName}`);
                yield file.delete();
                console.log(`🗑️ Image deleted: cakes/${imageName}`);
            }
        }
        yield cakeModel_1.default.findByIdAndDelete(cakeId);
        res.json({ success: true, message: "Product and image deleted successfully" });
    }
    catch (error) {
        console.error("❌ Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
});
exports.deleteProduct = deleteProduct;
const deleteProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🔍 Received Request Body:", req.body);
        const { productIds } = req.body;
        if (!Array.isArray(productIds) || productIds.length === 0) {
            res.status(400).json({ error: "Invalid productIds array" });
            return;
        }
        console.log("✅ Valid productIds:", productIds);
        const cakes = yield cakeModel_1.default.find({ _id: { $in: productIds } });
        console.log("🎂 Cakes found:", cakes);
        if (cakes.length === 0) {
            res.status(404).json({ error: "No products found" });
            return;
        }
        yield Promise.all(cakes.map((cake) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            if (cake.image) {
                const imageName = (_a = cake.image.split("%2F")[1]) === null || _a === void 0 ? void 0 : _a.split("?")[0];
                if (imageName) {
                    yield bucket.file(`cakes/${imageName}`).delete();
                    console.log(`🗑️ Image deleted: cakes/${imageName}`);
                }
            }
        })));
        yield cakeModel_1.default.deleteMany({ _id: { $in: productIds } });
        res.json({ success: true, message: "Products deleted successfully" });
    }
    catch (error) {
        console.error("❌ Error deleting products:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
});
exports.deleteProducts = deleteProducts;
//# sourceMappingURL=inventoryController.js.map
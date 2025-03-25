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
exports.updateStock = exports.removeFromFavorites = exports.addToFavorites = exports.getFavorites = exports.deleteCake = exports.getAllCakes = exports.updateCake = exports.addCake = void 0;
const cakeModel_1 = __importDefault(require("../models/cakeModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const addCake = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, price, ingredients, stock } = req.body;
    console.log("body: ", req.body);
    if (!name || !description || !price || !ingredients || !req.file) {
        res.status(400).json({ error: 'All fields including image are required' });
        return;
    }
    try {
        const uploadResult = yield cloudinary_1.default.uploader.upload(req.file.path, { folder: "cakes" });
        const cake = new cakeModel_1.default({
            name,
            description,
            price,
            ingredients,
            image: {
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            },
            stock,
        });
        const savedCake = yield cake.save();
        res.status(201).json(savedCake);
    }
    catch (err) {
        console.error('Failed to save cake:', err);
        res.status(500).json({ error: 'Failed to save cake' });
    }
});
exports.addCake = addCake;
const updateCake = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, description, price, ingredients, stock } = req.body;
    const cakeId = req.params.id;
    try {
        const cake = yield cakeModel_1.default.findById(cakeId);
        if (!cake) {
            res.status(404).json({ error: 'Cake not found' });
            return;
        }
        if (req.file) {
            if ((_a = cake.image) === null || _a === void 0 ? void 0 : _a.public_id) {
                yield cloudinary_1.default.uploader.destroy(cake.image.public_id);
            }
            const uploadResult = yield cloudinary_1.default.uploader.upload(req.file.path, { folder: "cakes" });
            cake.image = {
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            };
        }
        cake.name = name || cake.name;
        cake.description = description || cake.description;
        cake.price = price || cake.price;
        cake.ingredients = ingredients || cake.ingredients;
        cake.stock = stock || cake.stock;
        const updatedCake = yield cake.save();
        res.status(200).json(updatedCake);
    }
    catch (err) {
        console.error('Failed to update cake:', err);
        res.status(500).json({ error: 'Failed to update cake' });
    }
});
exports.updateCake = updateCake;
const getAllCakes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cakes = yield cakeModel_1.default.find();
        res.status(200).json(cakes);
    }
    catch (err) {
        console.error('Failed to fetch cakes:', err);
        res.status(500).json({ error: 'Failed to fetch cakes' });
    }
});
exports.getAllCakes = getAllCakes;
const deleteCake = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const cakeId = req.params.id;
    try {
        const cake = yield cakeModel_1.default.findById(cakeId);
        if (!cake) {
            res.status(404).json({ error: 'Cake not found' });
            return;
        }
        if ((_a = cake.image) === null || _a === void 0 ? void 0 : _a.public_id) {
            yield cloudinary_1.default.uploader.destroy(cake.image.public_id);
        }
        yield cakeModel_1.default.findByIdAndDelete(cakeId);
        res.status(200).json({ message: 'Cake deleted successfully' });
    }
    catch (err) {
        console.error('Failed to delete cake:', err);
        res.status(500).json({ error: 'Failed to delete cake' });
    }
});
exports.deleteCake = deleteCake;
const getFavorites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
    }
    try {
        const user = yield userModel_1.default.findById(userId).populate("favorites");
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ favorites: user.favorites });
    }
    catch (error) {
        console.error("Failed to fetch favorites:", error);
        res.status(500).json({ error: "Failed to fetch favorites" });
    }
});
exports.getFavorites = getFavorites;
const addToFavorites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, cakeId } = req.body;
    if (!userId || !cakeId) {
        res.status(400).json({ error: "User ID and Cake ID are required" });
        return;
    }
    try {
        const user = yield userModel_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        if (user.favorites.includes(cakeId)) {
            res.status(400).json({ error: "Cake is already in favorites" });
            return;
        }
        user.favorites.push(cakeId);
        yield user.save();
        res.status(200).json({ message: "Cake added to favorites" });
    }
    catch (err) {
        console.error('Failed to add cake to favorites:', err);
        res.status(500).json({ error: 'Failed to add cake to favorites' });
    }
});
exports.addToFavorites = addToFavorites;
const removeFromFavorites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, cakeId } = req.body;
    if (!userId || !cakeId) {
        res.status(400).json({ error: "User ID and Cake ID are required" });
        return;
    }
    try {
        const user = yield userModel_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const index = user.favorites.indexOf(cakeId);
        if (index === -1) {
            res.status(400).json({ error: "Cake not in favorites" });
            return;
        }
        user.favorites.splice(index, 1);
        yield user.save();
        res.status(200).json({ message: "Cake removed from favorites" });
    }
    catch (err) {
        console.error('Failed to remove cake from favorites:', err);
        res.status(500).json({ error: 'Failed to remove cake from favorites' });
    }
});
exports.removeFromFavorites = removeFromFavorites;
const updateStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { stock } = req.body;
        const cake = yield cakeModel_1.default.findByIdAndUpdate(req.params.id, { stock }, { new: true });
        if (!cake) {
            res.status(404).json({ message: "Cake not found" });
            return;
        }
        res.status(200).json(cake);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.updateStock = updateStock;
//# sourceMappingURL=cakeController.js.map
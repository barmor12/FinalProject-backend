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
exports.removeFromFavorites = exports.addToFavorites = exports.deleteCake = exports.getAllCakes = exports.updateCake = exports.addCake = void 0;
const cakeModel_1 = __importDefault(require("../models/cakeModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const addCake = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, price, ingredients, image } = req.body;
    if (!name || !description || !price || !ingredients || !image) {
        res.status(400).json({ error: 'All fields are required' });
        return;
    }
    try {
        const cake = new cakeModel_1.default({
            name,
            description,
            price,
            ingredients,
            image
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
    const { name, description, price, ingredients, image } = req.body;
    const cakeId = req.params.id;
    try {
        const updatedCake = yield cakeModel_1.default.findByIdAndUpdate(cakeId, {
            name,
            description,
            price,
            ingredients,
            image
        }, { new: true });
        if (!updatedCake) {
            res.status(404).json({ error: 'Cake not found' });
            return;
        }
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
    const cakeId = req.params.id;
    try {
        const deletedCake = yield cakeModel_1.default.findByIdAndDelete(cakeId);
        if (!deletedCake) {
            res.status(404).json({ error: 'Cake not found' });
            return;
        }
        res.status(200).json({ message: 'Cake deleted successfully' });
    }
    catch (err) {
        console.error('Failed to delete cake:', err);
        res.status(500).json({ error: 'Failed to delete cake' });
    }
});
exports.deleteCake = deleteCake;
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
//# sourceMappingURL=cakeController.js.map
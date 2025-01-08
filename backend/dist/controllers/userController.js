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
exports.updateUserProfile = exports.getUserProfile = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.body.userId;
    try {
        const user = yield userModel_1.default.findById(userId).select("-password -refresh_tokens");
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json(user);
    }
    catch (err) {
        console.error("Failed to fetch user profile:", err);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});
exports.getUserProfile = getUserProfile;
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.body.userId;
    const { nickname, email } = req.body;
    try {
        const user = yield userModel_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        if (req.file) {
            user.profilePic = `/uploads/${req.file.filename}`;
        }
        user.nickname = nickname || user.nickname;
        user.email = email || user.email;
        const updatedUser = yield user.save();
        res.status(200).json(updatedUser);
    }
    catch (err) {
        console.error("Failed to update user profile:", err);
        res.status(500).json({ error: "Failed to update user profile" });
    }
});
exports.updateUserProfile = updateUserProfile;
//# sourceMappingURL=userController.js.map
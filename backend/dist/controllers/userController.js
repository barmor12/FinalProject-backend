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
exports.getProfile = exports.updateProfile = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authController_1 = require("./authController");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
        return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded._id);
        if (!user) {
            return (0, authController_1.sendError)(res, "User not found", 404);
        }
        const { firstName, lastName, email, oldPassword, newPassword } = req.body;
        if (oldPassword && newPassword) {
            const isMatch = yield bcryptjs_1.default.compare(oldPassword, user.password);
            if (!isMatch) {
                return (0, authController_1.sendError)(res, "Old password is incorrect", 400);
            }
            user.password = yield bcryptjs_1.default.hash(newPassword, 10);
        }
        if (req.file) {
            user.profilePic = `/uploads/${req.file.filename}`;
        }
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        const updatedUser = yield user.save();
        console.log(updatedUser);
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    }
    catch (err) {
        console.error("Update profile error:", err);
        (0, authController_1.sendError)(res, "Failed to update profile", 500);
    }
});
exports.updateProfile = updateProfile;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
        return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded._id).select("-password -refresh_tokens");
        if (!user) {
            return (0, authController_1.sendError)(res, "User not found", 404);
        }
        res.status(200).send(user);
    }
    catch (err) {
        console.error("Get profile error:", err);
        (0, authController_1.sendError)(res, "Failed to get profile", 500);
    }
});
exports.getProfile = getProfile;
exports.default = {
    getProfile: exports.getProfile,
    updateProfile: exports.updateProfile
};
//# sourceMappingURL=userController.js.map
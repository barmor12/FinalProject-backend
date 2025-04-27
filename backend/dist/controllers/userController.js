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
exports.deleteProfile = exports.getProfile = exports.updateUserProfilePic = exports.updateUserName = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authController_1 = require("./authController");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const updateUserName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
        return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            return (0, authController_1.sendError)(res, "User not found", 404);
        }
        const { firstName, lastName } = req.body;
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        const updatedUser = yield user.save();
        res.status(200).json({
            message: "Name updated successfully",
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("Update name error:", err);
        (0, authController_1.sendError)(res, "Failed to update name", 500);
    }
});
exports.updateUserName = updateUserName;
const updateUserProfilePic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
        return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            return (0, authController_1.sendError)(res, "User not found", 404);
        }
        if (!req.file) {
            return (0, authController_1.sendError)(res, "No image provided", 400);
        }
        if (!req.file.mimetype.startsWith("image/")) {
            return (0, authController_1.sendError)(res, "Invalid file type. Only images are allowed.", 400);
        }
        console.log("Uploading new profile picture...");
        if (user.profilePic && user.profilePic.public_id) {
            yield cloudinary_1.default.uploader.destroy(user.profilePic.public_id);
        }
        const uploadResult = yield cloudinary_1.default.uploader.upload(req.file.path, {
            folder: "users",
        });
        console.log("Upload completed:", uploadResult.secure_url);
        user.profilePic = {
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
        };
        const updatedUser = yield user.save();
        res.status(200).json({
            message: "Profile picture updated successfully",
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("Update profile picture error:", err);
        (0, authController_1.sendError)(res, "Failed to update profile picture", 500);
    }
});
exports.updateUserProfilePic = updateUserProfilePic;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
        return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId).select("-password -refresh_tokens");
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
const deleteProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
        return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            return (0, authController_1.sendError)(res, "User not found", 404);
        }
        if (user.profilePic && user.profilePic.public_id) {
            console.log("profilePic", user.profilePic);
            console.log("publicID", user.profilePic.public_id);
            yield cloudinary_1.default.uploader.destroy((_a = user.profilePic) === null || _a === void 0 ? void 0 : _a.public_id);
        }
        yield userModel_1.default.findByIdAndDelete(decoded.userId);
        res.status(200).json({
            message: "Profile deleted successfully",
        });
    }
    catch (err) {
        console.error("Delete profile error:", err);
        (0, authController_1.sendError)(res, "Failed to delete profile", 500);
    }
});
exports.deleteProfile = deleteProfile;
exports.default = {
    getProfile: exports.getProfile,
    updateUserName: exports.updateUserName,
    updateUserProfilePic: exports.updateUserProfilePic,
    deleteProfile: exports.deleteProfile,
};
//# sourceMappingURL=userController.js.map
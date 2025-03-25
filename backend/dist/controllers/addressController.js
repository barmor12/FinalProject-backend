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
exports.deleteAddress = exports.updateAddress = exports.setDefaultAddress = exports.addAddress = exports.getUserAddresses = void 0;
const addressModel_1 = __importDefault(require("../models/addressModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const getUserAddresses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.body.userId;
        console.log("🔍 User ID from request:", userId);
        if (!userId) {
            res.status(401).json({ message: "Unauthorized. No user found." });
            return;
        }
        const addresses = yield addressModel_1.default.find({ userId });
        console.log("🔍 Found Addresses:", addresses);
        res.json(addresses);
    }
    catch (error) {
        console.error("❌ Error fetching addresses:", error);
        res.status(500).json({ message: "Failed to fetch addresses.", error });
    }
});
exports.getUserAddresses = getUserAddresses;
const addAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.body.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized. No user found." });
            return;
        }
        const { fullName, phone, street, city, isDefault } = req.body;
        if (isDefault) {
            yield addressModel_1.default.updateMany({ userId }, { isDefault: false });
        }
        const newAddress = new addressModel_1.default({ userId, fullName, phone, street, city, isDefault });
        yield newAddress.save();
        yield userModel_1.default.findByIdAndUpdate(userId, { $push: { addresses: newAddress._id } }, { new: true });
        res.status(201).json({ message: "Address added successfully.", address: newAddress });
    }
    catch (error) {
        console.error("❌ Error adding address:", error);
        res.status(500).json({ message: "Failed to add address.", error });
    }
});
exports.addAddress = addAddress;
const setDefaultAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { addressId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(addressId)) {
            res.status(400).json({ error: "Invalid address ID" });
            return;
        }
        const address = yield addressModel_1.default.findById(addressId);
        if (!address) {
            res.status(404).json({ error: "Address not found" });
            return;
        }
        yield addressModel_1.default.updateMany({ userId: address.userId }, { isDefault: false });
        address.isDefault = true;
        yield address.save();
        res.status(200).json({ message: "Default address updated successfully", address });
    }
    catch (error) {
        console.error("❌ Error setting default address:", error);
        res.status(500).json({ error: "Failed to update default address" });
    }
});
exports.setDefaultAddress = setDefaultAddress;
const updateAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.body.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized. No user found." });
            return;
        }
        const addressId = req.params.id;
        const { fullName, phone, street, city, isDefault } = req.body;
        const existingAddress = yield addressModel_1.default.findOne({ _id: addressId, userId });
        if (!existingAddress) {
            res.status(404).json({ message: "Address not found or does not belong to the user." });
            return;
        }
        if (isDefault) {
            yield addressModel_1.default.updateMany({ userId }, { isDefault: false });
        }
        const updatedAddress = yield addressModel_1.default.findByIdAndUpdate(addressId, { fullName, phone, street, city, isDefault }, { new: true });
        res.json({ message: "Address updated successfully.", address: updatedAddress });
    }
    catch (error) {
        console.error("❌ Error updating address:", error);
        res.status(500).json({ message: "Failed to update address.", error });
    }
});
exports.updateAddress = updateAddress;
const deleteAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.body.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized. No user found." });
            return;
        }
        const addressId = req.params.id;
        const existingAddress = yield addressModel_1.default.findOne({ _id: addressId, userId });
        if (!existingAddress) {
            res.status(404).json({ message: "Address not found or does not belong to the user." });
            return;
        }
        yield addressModel_1.default.findByIdAndDelete(addressId);
        res.json({ message: "Address deleted successfully." });
    }
    catch (error) {
        console.error("❌ Error deleting address:", error);
        res.status(500).json({ message: "Failed to delete address.", error });
    }
});
exports.deleteAddress = deleteAddress;
//# sourceMappingURL=addressController.js.map
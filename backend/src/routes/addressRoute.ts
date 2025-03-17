import express from "express";
import {
    getUserAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} from "../controllers/addressController";
import authMiddleware from "../common/authMiddleware"; // 👈 מייבאים את המידלוור

const router = express.Router();

router.get("/", authMiddleware, getUserAddresses); // 👈 כל הנתיבים מחייבים משתמש מחובר
router.post("/", authMiddleware, addAddress);
router.put("/:id", authMiddleware, updateAddress);
router.delete("/:id", authMiddleware, deleteAddress);
router.put("/default/:addressId", setDefaultAddress);

export default router;

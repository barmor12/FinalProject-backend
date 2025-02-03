import express from "express";
import cartController from "../controllers/cartController";
import authenticateMiddleware from "../common/authMiddleware";

const router = express.Router();

router.post("/add", authenticateMiddleware, cartController.addToCart);
router.get("/", authenticateMiddleware, cartController.getCart);
router.delete("/remove", authenticateMiddleware, cartController.removeFromCart);
router.delete("/clear", authenticateMiddleware, cartController.clearCart);
router.post("/update", authenticateMiddleware, cartController.updateCartItem);

export default router;

import express from "express";
import cartController from "../controllers/cartController";
import authenticateMiddleware from "../common/authMiddleware";

const router = express.Router();
router.use(authenticateMiddleware)
router.post("/add", cartController.addToCart);
router.get("/", cartController.getCart);
router.delete("/remove", cartController.removeFromCart);
router.delete("/clear", cartController.clearCart);
router.post("/update", cartController.updateCartItem);

export default router;

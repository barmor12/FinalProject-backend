import express from "express";
import {
  getAllProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/inventoryController";

const router = express.Router();

router.get("/", getAllProducts);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;

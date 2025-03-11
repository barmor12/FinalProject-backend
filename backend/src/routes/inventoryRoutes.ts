import express from "express";
import {
  getAllProducts,
  updateProduct,
  deleteProduct,
  deleteProducts,
} from "../controllers/inventoryController"; // ✅ וידוא שהנתיב מדויק

const router = express.Router();

router.get("/", getAllProducts);
router.put("/:id", updateProduct);
router.delete("/bulk-delete", deleteProducts); // 🛠️ נתיב ייחודי כדי למנוע התנגשות
router.delete("/:cakeId", deleteProduct);


export default router;

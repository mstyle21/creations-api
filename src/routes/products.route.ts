import express, { Request, Response } from "express";
import verifyToken from "../middleware/verifyToken.middleware";
import multer from "multer";
import { createProduct, deleteProductImage, getProducts, updateProduct } from "../controllers/product.controller";

const router = express.Router();

const storage = multer.memoryStorage();
const filter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (["jpeg", "jpg", "png"].includes(file.mimetype.split("/")[1])) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage: storage, fileFilter: filter });

router.get("/", verifyToken, getProducts);

router.post("/", verifyToken, upload.array("images"), createProduct);

router.put("/:productId", verifyToken, upload.array("images"), updateProduct);

router.delete("/:productId/image/:imageId", verifyToken, deleteProductImage);

export default router;

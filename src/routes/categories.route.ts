import express from "express";
import verifyToken from "../middleware/verifyToken.middleware";
import { createCategory, getAllCategories, getCategories, updateCategory } from "../controllers/category.controller";
import { categoryValidation } from "../validations/category.validation";

const router = express.Router();

//admin
router.post("/", verifyToken, categoryValidation(), createCategory);

router.put("/:categoryId", verifyToken, categoryValidation(), updateCategory);

//frontend
router.get("/", getCategories);
router.get("/all", getAllCategories);

export default router;

import express from "express";
import verifyToken from "../middleware/verifyToken.middleware";
import { createCategory, getAllCategories, getCategories, updateCategory } from "../controllers/category.controller";
import { categoryValidation } from "../validations/category.validation";

const router = express.Router();

router.get("/all", verifyToken, getAllCategories);

router.get("/", verifyToken, getCategories);

router.post("/", verifyToken, categoryValidation(), createCategory);

router.put("/:categoryId", verifyToken, categoryValidation(), updateCategory);

export default router;

import express from "express";
import verifyToken from "../middleware/verifyToken.middleware";
import { createOrder, getOrders } from "../controllers/order.controller";
import { orderValidation } from "../validations/order.validation";

const router = express.Router();

//admin
router.get("/", verifyToken, getOrders);

router.post("/", verifyToken, orderValidation(), createOrder);

//frontend

export default router;

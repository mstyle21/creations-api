import express from "express";

import { refreshToken, userLogin, userRegister } from "../controllers/user.controller";
import { userLoginValidation } from "../validations/user.validation";
import verifyToken from "../middleware/verifyToken.middleware";

const router = express.Router();

router.post("/register", userRegister);
router.post("/login", userLoginValidation(), userLogin);
router.post("/refresh-token", verifyToken, refreshToken);

export default router;

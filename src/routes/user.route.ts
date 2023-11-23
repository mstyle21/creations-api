import express from "express";

import { userLogin, userRegister } from "../controllers/user.controller";
import { userLoginValidation } from "../validations/user.validation";

const router = express.Router();

router.post("/register", userRegister);

router.post("/login", userLoginValidation(), userLogin);

export default router;

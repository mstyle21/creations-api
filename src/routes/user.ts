import express from "express";
import MysqlDataSource from "../config/data-source";
import { User } from "../entity/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export type JWTPayloadData = {
  time: string;
  userId: number;
  email: string;
  role: string;
};

const router = express.Router();
let jwtSecretKey: string;
if (process.env.JWT_SECRET_KEY) {
  jwtSecretKey = process.env.JWT_SECRET_KEY;
} else {
  throw new Error("JWT_SECRET_KEY is not set. Please check .env file.");
}

router.post("/register", (req, res) => {
  //register
});

router.post("/login", async (req, res) => {
  //login here
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.status(400).json({ message: "Invalid inputs!" });
  }

  let user = await MysqlDataSource.manager.findOne(User, {
    where: { email: email, status: "active" },
    relations: ["role"],
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    const payload: JWTPayloadData = {
      time: Date(),
      userId: user.id,
      email: user.email,
      role: user.role.name,
    };
    const token = jwt.sign(payload, jwtSecretKey, {
      expiresIn: "1h",
    });

    user.token = token;
    MysqlDataSource.manager.save(user);

    return res.json({
      email: user.email,
      token: token,
    });
  }

  return res.status(400).json({ message: "Invalid credentials!" });
});

export default router;

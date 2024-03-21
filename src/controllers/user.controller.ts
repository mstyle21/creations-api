import { NextFunction, Request, Response } from "express";
import MysqlDataSource from "../config/data-source";
import { User } from "../entity/User";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { validationResult } from "express-validator";

dotenv.config();

export type JWTPayloadData = {
  time: string;
  userId: number;
  email: string;
  role: string;
};

let jwtSecretKey: string;
if (process.env.JWT_SECRET_KEY) {
  jwtSecretKey = process.env.JWT_SECRET_KEY;
} else {
  throw new Error("JWT_SECRET_KEY is not set. Please check .env file.");
}

export const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  let user = await MysqlDataSource.manager.findOne(User, {
    where: { email: email, status: "active" },
    relations: ["role"],
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    let token;
    
    if (user.token) {
      token = user.token;

      const payloadCheck = jwt.verify(user.token, jwtSecretKey) as JwtPayload;
      const nowUnixSeconds = Math.round(Number(new Date()) / 1000);

      if (!payloadCheck.exp || payloadCheck.exp < nowUnixSeconds) {
        token = createUserToken(user)
      }
    } else {
      token = createUserToken(user)
    }

    return res.json({
      email: user.email,
      token: token,
    });
  }

  return res.status(400).json({ message: "Invalid credentials!" });
};

const createUserToken = (user: User) => {
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

  return token;
};

export const userRegister = async (req: Request, res: Response, next: NextFunction) => {};

import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import MysqlDataSource from "../config/data-source";
import { User } from "../entity/User";

dotenv.config();

let jwtSecretKey: string;
if (process.env.JWT_SECRET_KEY) {
  jwtSecretKey = process.env.JWT_SECRET_KEY;
} else {
  throw new Error("JWT_SECRET_KEY is not set. Please check .env file.");
}

const INVALID_TOKEN_MSG = "Token expired or invalid!";

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers["authorization"]) {
    token = req.headers["authorization"].split(" ")[1];
  }

  if (!token) {
    return res.status(403).json({ error: "A token is required for authentication" });
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecretKey) as JwtPayload;
    console.log(payload);
    const nowUnixSeconds = Math.round(Number(new Date()) / 1000);
    if (!payload.exp || payload.exp < nowUnixSeconds) {
      return res.status(401).json({ error: INVALID_TOKEN_MSG });
    }
  } catch (e: unknown) {
    return res.status(401).json({ error: INVALID_TOKEN_MSG });
  }

  const user = await MysqlDataSource.manager.findOne(User, { where: { id: payload.userId }, relations: { role: true } });
  if (!user || user.token !== token) {
    return res.status(400).json({ error: "Something went wrong, refresh and try again!" });
  }

  res.locals.loggedUser = user;

  return next();
};

export default verifyToken;

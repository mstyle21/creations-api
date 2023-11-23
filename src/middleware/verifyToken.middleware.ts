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

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers["authorization"]) {
    token = req.headers["authorization"].split(" ")[1];
  }

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecretKey) as JwtPayload;
    const nowUnixSeconds = Math.round(Number(new Date()) / 1000);
    if (!payload.exp || payload.exp < nowUnixSeconds) {
      return res.status(401).send("Token expired!");
    }
  } catch (e: unknown) {
    return res.status(401).send("Token expired!");
  }

  const user = await MysqlDataSource.manager.findOneBy(User, { id: payload.userId });
  if (!user || user.token !== token) {
    return res.status(400).send("Something went wrong, refresh and try again!");
  }

  res.locals.loggedUser = user;

  return next();
};

export default verifyToken;

import dotenv from "dotenv";
import { APP_ROOT_PATH } from "../app";

dotenv.config();

export const CURRENCY_SIGN = "RON";
export const FRONTEND_URL = process.env.FRONTEND_URL;
export const PRODUCT_IMG_FOLDER = APP_ROOT_PATH + "/../uploads/products";
export const PACKAGE_IMG_FOLDER = APP_ROOT_PATH + "/../uploads/packages";

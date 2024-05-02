import dotenv from "dotenv";

dotenv.config();

export const APP_ROOT_PATH = process.cwd();
export const CURRENCY_SIGN = "RON";
export const FRONTEND_URL = process.env.FRONTEND_URL;
export const PRODUCT_IMG_FOLDER = APP_ROOT_PATH + "/uploads/products";
export const PACKAGE_IMG_FOLDER = APP_ROOT_PATH + "/uploads/packages";

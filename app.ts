/**
 * Required External Modules
 */
import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import bodyParser from "body-parser";

import userRouter from "./src/routes/user.route";
import categoryRouter from "./src/routes/categories.route";
import productRouter from "./src/routes/products.route";
import packageRouter from "./src/routes/packages.route";

/**
 * App Variables
 */
dotenv.config();

if (!process.env.APP_PORT || !process.env.APP_URL) {
  console.error("Missing config items: APP_PORT or APP_URL. Please check .env file!");
  process.exit(1);
}

const URL: string = process.env.APP_URL as string;
const PORT: number = parseInt(process.env.APP_PORT as string, 10);

const app = express();

/**
 *  App Configuration
 */

app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(
  cors({
    credentials: true,
  })
);

app.use(compression());

app.use(cookieParser());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("uploads"));

/**
 * Server Activation
 */
app.use("/api/user", userRouter);

app.use("/api/categories", categoryRouter);

app.use("/api/products", productRouter);

app.use("/api/packages", packageRouter);

app.listen(PORT, () => {
  console.log(`Server running on ${URL}:${PORT}/`);
});

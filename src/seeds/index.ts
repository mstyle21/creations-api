import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { seedUserRole } from "./userRoles";
import { UserRole } from "../entity/UserRole";
import { seedUsers } from "./users";
import { User } from "../entity/User";

dotenv.config();

export const mysqlCli = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities: [UserRole, User],
});

const run = async () => {
  await mysqlCli.initialize();

  await seedUserRole();

  await seedUsers();

  mysqlCli.destroy();
};

run();

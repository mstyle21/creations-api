import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

const MysqlDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: process.env.APP_ENV === "local" ? true : false,
  logging: process.env.APP_ENV === "local" ? true : false,
  entities: [__dirname + "/../entity/*.{ts,js}"],
  migrations: [__dirname + "/../migrations/*.{ts,js}"],
  subscribers: [],
});

MysqlDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((error) => console.log(error));

export default MysqlDataSource;

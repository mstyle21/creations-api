import { mysqlCli } from ".";
import { User } from "../entity/User";
import bcrypt from "bcryptjs";
import { UserRole } from "../entity/UserRole";

const USERS: { email: string; password: string; role: string }[] = [
  { email: "admin@creations.com", password: "panseluta", role: "admin" },
  { email: "user@creations.com", password: "creations", role: "user" },
];

export const seedUsers = () => {
  console.log("Seeding users...");

  const userRepository = mysqlCli.getRepository(User);

  const seed = async () => {
    for (const user of USERS) {
      const userExists = await userRepository.findOneBy({
        email: user.email,
      });

      if (!userExists) {
        const newUser = new User();

        newUser.email = user.email;
        newUser.password = bcrypt.hashSync(
          user.password,
          bcrypt.genSaltSync(10)
        );

        const role = await mysqlCli.getRepository(UserRole).findOneBy({
          name: user.role,
        });

        if (!role) {
          throw new Error(`User role: ${user.role} not found!`);
        }
        newUser.role = role;

        await userRepository.save(newUser);
      }
    }
  };

  return new Promise((resolve, reject) => {
    seed()
      .then(() => {
        console.log("Users seeding completed!");
        resolve("OK");
      })
      .catch((e) => {
        console.error("Error seeding users: ", e);
        reject("error");
      });
  });
};

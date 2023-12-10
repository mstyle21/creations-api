import { UserRole } from "../entity/UserRole";
import { mysqlCli } from ".";

const ROLES = [{ name: "user" }, { name: "admin" }];

export const seedUserRole = () => {
  console.log("Seeding user roles...");

  const userRoleRepository = mysqlCli.getRepository(UserRole);

  const seed = async () => {
    for (const userRole of ROLES) {
      const userRoleExists = await userRoleRepository.findOneBy({
        name: userRole.name,
      });

      if (!userRoleExists) {
        const newRole = new UserRole();

        newRole.name = userRole.name;

        await userRoleRepository.save(newRole);
      }
    }
  };

  return new Promise((resolve, reject) => {
    seed()
      .then(() => {
        console.log("User roles seeding completed!");
        resolve("OK");
      })
      .catch((e) => {
        console.error("Error seeding user roles: ", e);
        reject("error");
      });
  });
};

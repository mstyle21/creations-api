import MysqlDataSource from "../config/data-source";
import { UserRole } from "../entity/UserRole";

const ROLES = [{ name: "user" }, { name: "admin" }];

const userRoleRepository = MysqlDataSource.getRepository(UserRole);

export const seedUserRole = () => {
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

  seed()
    .then(() => console.log("Seeding completed!"))
    .catch((e) => console.error("Error seeding: ", e));
};

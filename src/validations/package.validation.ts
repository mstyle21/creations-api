import { body } from "express-validator";
import { packageStatus } from "../entity/Package";

export const packageValidation = () => {
  return [
    body("name")
      .exists({ values: "falsy" })
      .withMessage("Name is required.")
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty."),
    body("status").exists().withMessage("Status is required").isIn(packageStatus).withMessage("Status is invalid."),
    body("category").exists().withMessage("Category is required").isNumeric(),
    body("price").exists().withMessage("Price is required").isNumeric(),
    body("oldPrice").optional({ values: "falsy" }).isNumeric(),
    body("products").exists().isJSON(),
    body("stock").exists().withMessage("Stock is required").isNumeric(),
  ];
};

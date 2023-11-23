import { body } from "express-validator";

export const categoryValidation = () => {
  return [
    body("name")
      .exists({ values: "falsy" })
      .withMessage("Name is required.")
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty."),
    body("status")
      .exists()
      .withMessage("Status is required")
      .isIn(["active", "inactive"])
      .withMessage("Status is invalid."),
  ];
};

import { body } from "express-validator";

export const userLoginValidation = () => {
  return [
    body("email")
      .exists({ values: "falsy" })
      .withMessage("Email is required")
      .trim()
      .notEmpty()
      .withMessage("Email cannot be empty.")
      .isEmail()
      .withMessage("Email invalid format."),
    body("password")
      .exists({ values: "falsy" })
      .withMessage("Password is required")
      .trim()
      .notEmpty()
      .withMessage("Password cannot be empty.")
      .isLength({ min: 6 }),
  ];
};

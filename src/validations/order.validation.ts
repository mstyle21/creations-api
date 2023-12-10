import { body } from "express-validator";
import { orderStatus } from "../entity/Order";

export const orderValidation = () => {
  return [
    body("date").exists().withMessage("Date is required"),
    body("status").exists().withMessage("Status is required").isIn(orderStatus),
    body("products").custom((values, { req }) => {
      if (!values && !req.body.packages) {
        throw new Error("Order must contain at least one item");
      }

      return true;
    }),
    body("products.*.id").exists().isInt(),
    body("products.*.quantity").exists().isInt(),
    body("products.*.price").exists().isInt(),
    body("packages").custom((values, { req }) => {
      if (!values && !req.body.products) {
        throw new Error("Order must contain at least one item");
      }

      return true;
    }),
    body("packages.*.id").exists().isInt(),
    body("packages.*.quantity").exists().isInt(),
    body("packages.*.price").exists().isInt(),
  ];
};

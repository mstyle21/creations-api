import { body } from "express-validator";

export const productValidation = () => {
  return [
    body("name").trim().notEmpty().bail().withMessage("Name cannot be empty."),
    body("width").notEmpty().bail().withMessage("Width is required.").isDecimal().withMessage("Invalid width, must be a valid number."),
    body("height").notEmpty().bail().withMessage("Height is required.").isDecimal().withMessage("Invalid height, must be a valid number."),
    body("depth").notEmpty().bail().withMessage("Depth is required.").isDecimal().withMessage("Invalid depth, must be a valid number."),
    body("stock").notEmpty().bail().withMessage("Stock is required.").isInt().withMessage("Invalid stock, must be a valid number."),
    body("materialWeight").optional({ values: "falsy" }).isInt().withMessage("Invalid material weight, must be a valid number."),
    body("price").notEmpty().bail().withMessage("Price is required.").isDecimal().withMessage("Invalid price, must be a valid number."),
    body("oldPrice").optional({ values: "falsy" }).isDecimal().withMessage("Invalid old price, must be a valid number."),
    body("status").isIn(["active", "inactive"]).withMessage("Invalid status provided."),
    body("categories").toArray().isArray({ min: 1 }).withMessage("Select at least one category."),
    body("imagesOrder"),
    body("images"),
  ];
};

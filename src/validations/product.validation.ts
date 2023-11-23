import { body } from "express-validator";

export const productValidation = () => {
  return [
    body("name"),
    body("width"),
    body("height"),
    body("depth"),
    body("stock"),
    body("price"),
    body("status"),
    body("categories"),
    body("imagesOrder"),
    body("images"),
  ];
};

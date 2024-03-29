import { NextFunction, Request, Response } from "express";
import MysqlDataSource from "../config/data-source";
import { Category } from "../entity/Category";
import { validationResult } from "express-validator";
import { FindOperator, FindOptionsOrder, Like } from "typeorm";
import { paginatedResult } from "../utils";
import { PaginationQuery } from "../types";

const categoryRepository = MysqlDataSource.getRepository(Category);

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  const categories = await categoryRepository.find();

  return res.status(200).json(categories);
};

interface StatsQuery extends PaginationQuery {
  search?: string;
  sortBy?: string;
  order?: string;
}

const sortableBy = ["id", "name"];
export const getCategories = async (req: Request<{}, {}, {}, StatsQuery>, res: Response, next: NextFunction) => {
  const { search, page, perPage, sortBy, order } = req.query;

  let pag = 1;
  let limit = 10;
  if (perPage && !isNaN(parseInt(perPage)) && parseInt(perPage) > 0) {
    limit = parseInt(perPage);
  }
  if (page && !isNaN(parseInt(page)) && parseInt(page) > 0) {
    pag = parseInt(page);
  }
  const skip = limit * pag - limit;

  const where: {
    name?: FindOperator<string>;
  } = {};
  if (search) {
    where.name = Like(`%${search}%`);
  }

  let orderQ: FindOptionsOrder<Category> = { id: "DESC" };
  if (sortBy && order && sortableBy.includes(sortBy) && ["asc", "desc"].includes(order)) {
    orderQ = { [sortBy]: order };
  }

  const categories = await categoryRepository.find({
    where: where,
    relations: {
      products: true,
      packages: true,
    },
    order: orderQ,
    take: limit,
    skip: skip,
  });

  if (sortBy && order && ["packages", "products"].includes(sortBy) && ["asc", "desc"].includes(order)) {
    categories.sort((a, b) => {
      let aItem = sortBy === "packages" ? a.packages : a.products;
      let bItem = sortBy === "packages" ? b.packages : b.products;

      return order === "asc" ? aItem.length - bItem.length : bItem.length - aItem.length;
    });
  }

  const countFilteredCategories = await categoryRepository.find({ where });

  return res.status(200).json(paginatedResult(categories, countFilteredCategories.length, limit));
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, status } = req.body;

  const category = new Category();
  category.name = name;
  category.status = status;

  await categoryRepository.save(category);

  return res.status(201).json({ message: "Category created!" });
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { name, status } = req.body;
  const categoryId = req.params.categoryId;

  if (!categoryId || !name || !status) {
    return res.status(400).json({ message: "Invalid request!" });
  }

  const category = await categoryRepository.findOne({
    where: { id: parseInt(categoryId) },
  });

  if (!category) {
    return res.status(400).json({ message: "Something went wrong. Category not found!" });
  }

  category.name = name;
  category.status = status;

  await categoryRepository.save(category);

  return res.status(201).json({ message: "Category updated!" });
};

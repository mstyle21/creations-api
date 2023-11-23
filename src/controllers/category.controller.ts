import { NextFunction, Request, Response } from "express";
import MysqlDataSource from "../config/data-source";
import { Category } from "../entity/Category";
import { validationResult } from "express-validator";
import { FindOperator } from "typeorm";

const categoryRepository = MysqlDataSource.getRepository(Category);

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  const categories = await categoryRepository.find();

  return res.status(200).json(categories);
};

interface StatsQuery extends qs.ParsedQs {
  search?: string;
  page?: string;
  perPage?: string;
}
export const getCategories = async (req: Request<{}, {}, {}, StatsQuery>, res: Response, next: NextFunction) => {
  const { search, page, perPage } = req.query;

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

  const categories = await categoryRepository.find({
    where: where,
    relations: {
      products: true,
      packages: true,
    },
    take: limit,
    skip: skip,
  });
  const countFilteredCategories = await categoryRepository.find({ where });

  return res.status(200).json({
    items: categories,
    count: countFilteredCategories.length,
    pages: Math.floor(countFilteredCategories.length / limit) + 1,
  });
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
function Like(arg0: string): FindOperator<string> | undefined {
  throw new Error("Function not implemented.");
}

import express, { Request, Response } from "express";
import MysqlDataSource from "../config/data-source";
import { Category } from "../entity/Category";
import verifyToken from "../middleware/verifyToken";
import { FindOperator, Like } from "typeorm";

const router = express.Router();

const categoryRepository = MysqlDataSource.getRepository(Category);

interface StatsQuery extends qs.ParsedQs {
  search?: string;
  page?: string;
  perPage?: string;
}

router.get("/all", verifyToken, async (req, res) => {
  const categories = await categoryRepository.find();

  return res.status(200).json(categories);
});

router.get("/", verifyToken, async (req: Request<{}, {}, {}, StatsQuery>, res: Response) => {
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
});

/**
 * POST METHOD
 * Create new category
 */
router.post("/", verifyToken, async (req, res) => {
  const { name, status } = req.body;

  if (!name || !status) {
    return res.status(400).json({ message: "Invalid request!" });
  }

  const category = new Category();
  category.name = name;
  category.status = status;

  await categoryRepository.save(category);

  return res.status(201).json({ message: "Category created!" });
});

/**
 * PUT METHOD
 * Update an existing category
 */
router.put("/:categoryId", verifyToken, async (req, res) => {
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
});

export default router;

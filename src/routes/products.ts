import express, { Request, Response } from "express";
import MysqlDataSource from "../config/data-source";
import verifyToken from "../middleware/verifyToken";
import { FindOperator, In, Like, Not } from "typeorm";
import { Product } from "../entity/Product";
import { Category } from "../entity/Category";
import multer from "multer";
import path from "path";
import { generateSlug, randomHash } from "../utils";
import { ProductImage } from "../entity/ProductImage";
import * as fs from "fs";
import { PRODUCT_IMG_FOLDER } from "../config";

const router = express.Router();

const productRepository = MysqlDataSource.getRepository(Product);
const productImageRepository = MysqlDataSource.getRepository(ProductImage);
const categoryRepository = MysqlDataSource.getRepository(Category);

const storage = multer.memoryStorage();
const filter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (["jpeg", "jpg", "png"].includes(file.mimetype.split("/")[1])) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage: storage, fileFilter: filter });

interface StatsQuery extends qs.ParsedQs {
  search?: string;
  page?: string;
  perPage?: string;
}

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

  const products = await productRepository.find({
    where: where,
    relations: {
      categories: true,
      images: true,
    },
    order: {
      id: "DESC",
      images: {
        order: "ASC",
      },
    },
    take: limit,
    skip: skip,
  });
  const countFilteredProducts = await productRepository.find({ where });

  return res.status(200).json({
    items: products,
    count: countFilteredProducts.length,
    pages: Math.floor(countFilteredProducts.length / limit) + 1,
  });
});

interface ProductBody {
  name: string;
  width: number;
  height: number;
  depth: number;
  stock: number;
  price: number;
  status: string;
  categories: [];
  imagesOrder: string;
}
/**
 * POST METHOD
 * Create new product
 */
router.post("/", verifyToken, upload.array("images"), async (req: Request<{}, {}, ProductBody>, res: Response) => {
  const { name, width, height, depth, stock, price, status, categories, imagesOrder } = req.body;

  if (!name || !width || !height || !depth || !stock || !price || !status || !categories) {
    return res.status(400).json({ message: "Invalid request!" });
  }

  try {
    const product = new Product();
    product.name = name;
    product.width = width;
    product.height = width;
    product.depth = width;
    product.stock = stock;
    product.price = price;
    product.status = status;

    product.categories = await categoryRepository.findBy({ id: In(categories) });

    let slug = generateSlug(name);
    let counter = 1;
    while ((await productRepository.findBy({ slug: slug })).length) {
      slug += `-${counter}`;
      counter++;
    }

    product.slug = slug;

    const newProduct = await productRepository.save(product);

    const images = req.files as Express.Multer.File[];
    if (images.length) {
      const imgOrder = JSON.parse(imagesOrder);
      const folderPath = path.join(PRODUCT_IMG_FOLDER, newProduct.id.toString());

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }

      images.forEach((image) => {
        const imageHash = randomHash(6);
        const imageName = `${imageHash}.${image.originalname.split(".").pop()}`;

        fs.writeFileSync(path.join(folderPath, imageName), image.buffer);

        const productImage = new ProductImage();
        productImage.product = newProduct;
        productImage.filename = imageName;
        productImage.order = imgOrder[image.originalname];

        productImageRepository.save(productImage);
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Something went wrong!" });
  }

  return res.status(201).json({ message: "Product created!" });
});

/**
 * PUT METHOD
 * Update an existing product
 */
router.put(
  "/:productId",
  verifyToken,
  upload.array("images"),
  async (req: Request<{ productId: string }, {}, ProductBody, {}>, res: Response) => {
    const { name, width, height, depth, stock, price, status, categories, imagesOrder } = req.body;
    const productId = req.params.productId;

    if (!productId || !name || !width || !height || !depth || !stock || !price || !status) {
      return res.status(400).json({ message: "Invalid request!" });
    }

    const product = await productRepository.findOne({
      where: { id: parseInt(productId) },
      relations: { images: true },
    });

    if (!product) {
      return res.status(400).json({ message: "Something went wrong. Category not found!" });
    }

    product.name = name;
    product.width = width;
    product.height = width;
    product.depth = width;
    product.stock = stock;
    product.price = price;
    product.status = status;

    product.categories = await categoryRepository.findBy({ id: In(categories) });

    const imgOrder = JSON.parse(imagesOrder);

    product.images = product.images.map((productImage) => {
      if (imgOrder[productImage.filename] !== undefined) {
        productImage.order = imgOrder[productImage.filename];
      }
      return productImage;
    });

    let slug = generateSlug(name);
    let counter = 1;
    while ((await productRepository.findBy({ slug: slug, id: Not(product.id) })).length) {
      slug += `-${counter}`;
      counter++;
    }

    product.slug = slug;

    await productRepository.save(product);

    const images = req.files as Express.Multer.File[];
    if (images.length) {
      const imgOrder = JSON.parse(imagesOrder);
      const folderPath = path.join(PRODUCT_IMG_FOLDER, product.id.toString());

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }

      images.forEach((image) => {
        const imageHash = randomHash(6);
        const imageName = `${imageHash}.${image.originalname.split(".").pop()}`;

        fs.writeFileSync(path.join(folderPath, imageName), image.buffer);

        const productImage = new ProductImage();
        productImage.product = product;
        productImage.filename = imageName;
        productImage.order = imgOrder[image.originalname];

        productImageRepository.save(productImage);
      });
    }

    return res.status(201).json({ message: "Product updated!" });
  }
);

router.delete("/image/:imageId", verifyToken, async (req, res) => {
  const imageId = req.params.imageId;

  const productImage = await productImageRepository.findOne({
    where: { id: Number(imageId) },
    relations: {
      product: {
        images: true,
      },
    },
  });

  if (!productImage) {
    return res.status(400).json({ message: "Invalid request!" });
  }

  const folderPath = path.join(PRODUCT_IMG_FOLDER, productImage.product.id.toString());
  const filePath = path.join(folderPath, productImage.filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await productImageRepository.remove(productImage);

  productImage.product.images.forEach(async (image) => {
    if (image.order > productImage.order) {
      await productImageRepository.save({ ...image, order: image.order - 1 });
    }
  });

  return res.status(204).json({ message: "Product image deleted" });
});

export default router;

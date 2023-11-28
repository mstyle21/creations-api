import { Request, Response, NextFunction } from "express";
import MysqlDataSource from "../config/data-source";
import { Category } from "../entity/Category";
import { Product } from "../entity/Product";
import { ProductImage } from "../entity/ProductImage";
import { FindOperator, FindOptionsOrder, In, Like, Not } from "typeorm";
import path from "path";
import * as fs from "fs";
import { PRODUCT_IMG_FOLDER } from "../config";
import { generateSlug, randomHash } from "../utils";

const productRepository = MysqlDataSource.getRepository(Product);
const productImageRepository = MysqlDataSource.getRepository(ProductImage);
const categoryRepository = MysqlDataSource.getRepository(Category);

interface StatsQuery extends qs.ParsedQs {
  search?: string;
  page?: string;
  perPage?: string;
  categories?: string[];
  orderBy?: string;
}

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

const sortByList: Record<string, object> = {
  recent: { id: "DESC" },
  name: { name: "ASC" },
  priceAsc: { price: "ASC" },
  priceDesc: { price: "DESC" },
};

export const getProducts = async (req: Request<{}, {}, {}, StatsQuery>, res: Response, next: NextFunction) => {
  const { search, page, perPage, categories, orderBy } = req.query;

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
    status: string;
    name?: FindOperator<string>;
    categories?: { id: FindOperator<number> };
  } = {
    status: "active",
  };
  if (search) {
    where.name = Like(`%${search}%`);
  }
  if (categories && Array.isArray(categories)) {
    const initial: number[] = [];
    const parsedArray = categories.reduce((result, category) => {
      const checkInt = parseInt(category.toString());
      if (!isNaN(checkInt)) {
        result.push(checkInt);
      }

      return result;
    }, initial);
    where.categories = {
      id: In(parsedArray),
    };
  }
  let order: FindOptionsOrder<Product> = { id: "DESC" };
  if (orderBy && sortByList[orderBy] !== undefined) {
    order = sortByList[orderBy];
  }

  let products = await productRepository.find({
    where: where,
    relations: {
      categories: true,
      images: true,
    },
    order: order,
    take: limit,
    skip: skip,
  });
  const countFilteredProducts = await productRepository.find({ where });

  products = products.map((product) => {
    return { ...product, images: product.images.sort((a, b) => a.order - b.order) };
  });

  return res.status(200).json({
    items: products,
    count: countFilteredProducts.length,
    pages: Math.floor(countFilteredProducts.length / limit) + 1,
  });
};

export const getLatestProducts = async (req: Request, res: Response, next: NextFunction) => {
  let products = await productRepository.find({
    relations: { images: true },
    where: { status: "active" },
    order: { id: "DESC" },
    take: 4,
  });

  return res.status(200).json(products);
};

export const getProductStats = async (req: Request, res: Response, next: NextFunction) => {
  let products = await productRepository.find({ where: { status: "active" } });

  return res.status(200).json(products);
};

export const createProduct = async (req: Request<{}, {}, ProductBody>, res: Response, next: NextFunction) => {
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
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
  const imageId = req.params.imageId;
  const productId = req.params.productId;

  const productImage = await productImageRepository.findOne({
    where: { id: Number(imageId) },
    relations: {
      product: {
        images: true,
      },
    },
  });

  if (!productImage || productImage.product.id.toString() !== productId) {
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
};

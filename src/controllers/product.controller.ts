import { Request, Response, NextFunction } from "express";
import MysqlDataSource from "../config/data-source";
import { Category } from "../entity/Category";
import { Product } from "../entity/Product";
import { ProductImage } from "../entity/ProductImage";
import { FindOperator, FindOptionsOrder, FindOptionsWhere, In, Like, Not } from "typeorm";
import path from "path";
import * as fs from "fs";
import { PRODUCT_IMG_FOLDER } from "../config";
import { generateSlug, paginatedResult, randomHash } from "../utils";
import { uploadImage } from "../services/imagesService";

const productRepository = MysqlDataSource.getRepository(Product);
const productImageRepository = MysqlDataSource.getRepository(ProductImage);
const categoryRepository = MysqlDataSource.getRepository(Category);

interface StatsQuery extends qs.ParsedQs {
  search?: string;
  page?: string;
  perPage?: string;
  categories?: string[];
  availability?: string;
  orderBy?: string;
}

interface ProductBody {
  name: string;
  width: string;
  height: string;
  depth: string;
  stock: string;
  price: string;
  oldPrice?: string;
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
  const { search, page, perPage, categories, availability, orderBy } = req.query;

  let pag = 1;
  let limit = 10;
  if (perPage && !isNaN(parseInt(perPage)) && parseInt(perPage) > 0) {
    limit = parseInt(perPage);
  }
  if (page && !isNaN(parseInt(page)) && parseInt(page) > 0) {
    pag = parseInt(page);
  }
  const skip = limit * pag - limit;

  const where: FindOptionsWhere<Product> = {
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
  let order: FindOptionsOrder<Product> = { stock: "DESC", id: "DESC" };
  if (orderBy && sortByList[orderBy] !== undefined) {
    order = { ...order, ...sortByList[orderBy] };
  }
  if (availability && ["yes", "no"].includes(availability)) {
    where.stock = availability === "yes" ? Not(0) : 0;
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

  return res.status(200).json(paginatedResult(products, countFilteredProducts.length, limit));
};

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  let products = await productRepository.find({ relations: { images: true } });

  return res.status(200).json(products);
};

export const getLatestProducts = async (req: Request, res: Response, next: NextFunction) => {
  let products = await productRepository.find({
    relations: { images: true },
    where: { status: "active" },
    order: { id: "DESC" },
    take: 8,
  });

  return res.status(200).json(products);
};

export const getProductDetailsBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const productSlug = req.params.productSlug;

  let product = await productRepository.findOne({
    relations: { images: true, categories: true },
    where: { status: "active", slug: productSlug },
  });

  return res.status(200).json(product);
};

export const getProductStats = async (req: Request, res: Response, next: NextFunction) => {
  let products = await productRepository.find({ where: { status: "active" } });

  return res.status(200).json(products);
};

export const createProduct = async (req: Request<{}, {}, ProductBody>, res: Response, next: NextFunction) => {
  const { name, width, height, depth, stock, price, oldPrice, status, categories, imagesOrder } = req.body;

  if (!name || !width || !height || !depth || !stock || !price || !status || !categories) {
    return res.status(400).json({ message: "Invalid request!" });
  }

  try {
    const product = new Product();
    product.name = name;
    product.width = parseFloat(width);
    product.height = parseFloat(height);
    product.depth = parseFloat(depth);
    product.stock = parseInt(stock);
    product.price = parseInt(price);
    product.oldPrice = oldPrice && oldPrice !== "" ? parseInt(oldPrice) : null;
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
    await uploadProductImages(images, imagesOrder, product);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Something went wrong!" });
  }

  return res.status(201).json({ message: "Product created!" });
};

export const updateProduct = async (
  req: Request<{ productId: string }, {}, ProductBody>,
  res: Response,
  next: NextFunction
) => {
  const { name, width, height, depth, stock, price, oldPrice, status, categories, imagesOrder } = req.body;
  const productId = req.params.productId;

  if (!productId || !name || !width || !height || !depth || !stock || !price || !status) {
    return res.status(400).json({ message: "Invalid request!" });
  }

  const product = await productRepository.findOne({
    where: { id: parseInt(productId) },
    relations: { images: true },
  });

  if (!product) {
    return res.status(400).json({ message: "Something went wrong. Product not found!" });
  }

  product.name = name;
  product.width = parseFloat(width);
  product.height = parseFloat(height);
  product.depth = parseFloat(depth);
  product.stock = parseInt(stock);
  product.price = parseInt(price);
  product.oldPrice = oldPrice && oldPrice !== "" ? parseInt(oldPrice) : null;
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
  await uploadProductImages(images, imagesOrder, product);

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

const uploadProductImages = async (images: Express.Multer.File[], imagesOrder: string, product: Product) => {
  if (images && images.length) {
    const imgOrder = JSON.parse(imagesOrder);
    const folderPath = path.join(PRODUCT_IMG_FOLDER, product.id.toString());

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    for (const image of images) {
      const imageHash = randomHash(6);
      const imageName = `${imageHash}.${image.originalname.split(".").pop()}`;

      await uploadImage(image.buffer, folderPath, imageName);

      const productImage = new ProductImage();
      productImage.product = product;
      productImage.filename = imageName;
      productImage.order = imgOrder[image.originalname];

      productImageRepository.save(productImage);
    }
  }
};

import { NextFunction, Request, Response } from "express";
import { FindOperator, Like, In, FindOptionsOrder, Not, FindOptionsWhere } from "typeorm";
import MysqlDataSource from "../config/data-source";
import { Category } from "../entity/Category";
import { Package } from "../entity/Package";
import { PackageImage } from "../entity/PackageImage";
import { Product } from "../entity/Product";
import { generateSlug, paginatedResult, randomHash } from "../utils";
import { validationResult } from "express-validator";
import { PACKAGE_IMG_FOLDER } from "../config";
import path from "path";
import * as fs from "fs";
import { PackageProduct } from "../entity/PackageProduct";
import { uploadImage } from "../services/imagesService";

const packageRepository = MysqlDataSource.getRepository(Package);
const packageProductRepository = MysqlDataSource.getRepository(PackageProduct);
const packageImageRepository = MysqlDataSource.getRepository(PackageImage);
const categoryRepository = MysqlDataSource.getRepository(Category);
const productRepository = MysqlDataSource.getRepository(Product);

interface StatsQuery extends qs.ParsedQs {
  search?: string;
  page?: string;
  perPage?: string;
  categories?: string[];
  availability?: string;
  orderBy?: string;
}

interface PackageBody {
  name: string;
  stock: string;
  price: string;
  oldPrice?: string;
  status: string;
  category: string;
  products: string;
  imagesOrder: string;
}

const sortByList: Record<string, object> = {
  recent: { id: "DESC" },
  name: { name: "ASC" },
  priceAsc: { price: "ASC" },
  priceDesc: { price: "DESC" },
};

export const getPackages = async (req: Request<{}, {}, {}, StatsQuery>, res: Response, next: NextFunction) => {
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

  const where: FindOptionsWhere<Package> = {
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
    where.category = {
      id: In(parsedArray),
    };
  }
  let order: FindOptionsOrder<Package> = { stock: "DESC", id: "DESC" };
  if (orderBy && sortByList[orderBy] !== undefined) {
    order = { ...order, ...sortByList[orderBy] };
  }
  if (availability && ["yes", "no"].includes(availability)) {
    where.stock = availability === "yes" ? Not(0) : 0;
  }

  let packages = await packageRepository.find({
    where: where,
    relations: {
      category: true,
      products: {
        product: {
          images: true,
        },
      },
      images: true,
    },
    order: order,
    take: limit,
    skip: skip,
  });
  const countFilteredPackages = await packageRepository.find({ where });

  packages = packages.map((packageDetails) => {
    return { ...packageDetails, images: packageDetails.images.sort((a, b) => a.order - b.order) };
  });

  return res.status(200).json(paginatedResult(packages, countFilteredPackages.length, limit));
};

export const getPackageDetailsBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const packageSlug = req.params.packageSlug;

  let packageDetails = await packageRepository.findOne({
    relations: { images: true, products: { product: { images: true } }, category: true },
    where: { status: "active", slug: packageSlug },
  });

  return res.status(200).json(packageDetails);
};

export const getPackageStats = async (req: Request, res: Response, next: NextFunction) => {
  let packages = await packageRepository.find({ where: { status: "active" } });

  return res.status(200).json(packages);
};

export const createPackage = async (req: Request<{}, {}, PackageBody>, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, stock, price, oldPrice, status, category, products, imagesOrder } = req.body;

  try {
    const packageDetails = new Package();
    packageDetails.name = name;
    packageDetails.stock = parseInt(stock);
    packageDetails.price = parseInt(price);
    packageDetails.oldPrice = oldPrice && oldPrice !== "" ? parseInt(oldPrice) : null;
    packageDetails.status = status;

    const packageCategory = await categoryRepository.findOneBy({ id: Number(category) });
    if (!packageCategory) {
      return res.status(400).json({ message: "Invalid category." });
    }
    packageDetails.category = packageCategory;

    let slug = generateSlug(name);
    let counter = 1;
    while ((await packageRepository.findBy({ slug: slug })).length) {
      slug += `-${counter}`;
      counter++;
    }

    packageDetails.slug = slug;
    packageDetails.products = [];

    const packageProducts: { productId: number; name: string; quantity: number }[] = JSON.parse(products);
    for (const packageProduct of packageProducts) {
      const productItem = await productRepository.findOneBy({ id: packageProduct.productId });
      if (productItem) {
        const prod = new PackageProduct();
        prod.quantity = packageProduct.quantity;
        prod.product = productItem;

        packageDetails.products.push(prod);
      }
    }

    if (packageDetails.products.length === 0) {
      return res.status(400).json({ message: "Package must contain products." });
    }

    const newPackage = await packageRepository.save(packageDetails);

    const images = req.files as Express.Multer.File[];
    await uploadPackageImages(images, imagesOrder, packageDetails);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Something went wrong!" });
  }

  return res.status(201).json({ message: "Package created!" });
};

export const updatePackage = async (
  req: Request<{ packageId: string }, {}, PackageBody>,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, stock, price, oldPrice, status, category, products, imagesOrder } = req.body;
  const packageId = req.params.packageId;

  const packageDetails = await packageRepository.findOne({
    where: { id: Number(packageId) },
    relations: { images: true, products: { product: true } },
  });

  if (!packageDetails) {
    return res.status(400).json({ message: "Something went wrong. Package not found!" });
  }

  packageDetails.name = name;
  packageDetails.stock = parseInt(stock);
  packageDetails.price = parseInt(price);
  packageDetails.oldPrice = oldPrice && oldPrice !== "" ? parseInt(oldPrice) : null;
  packageDetails.status = status;

  const packageCategory = await categoryRepository.findOneBy({ id: Number(category) });
  if (!packageCategory) {
    return res.status(400).json({ message: "Invalid category." });
  }
  packageDetails.category = packageCategory;

  let slug = generateSlug(name);
  let counter = 1;
  while ((await packageRepository.findBy({ slug: slug, id: Not(packageDetails.id) })).length) {
    slug += `-${counter}`;
    counter++;
  }
  packageDetails.slug = slug;

  const updatedPackageProducts: { productId: number; name: string; quantity: number }[] = JSON.parse(products);

  for (const packageProduct of packageDetails.products) {
    const packageProductKept = updatedPackageProducts.find((item) => item.productId === packageProduct.product.id);
    if (!packageProductKept) {
      await packageProductRepository.remove(packageProduct);
      packageDetails.products = packageDetails.products.filter((item) => item.id !== packageProduct.id);
    }
  }

  for (const updatedPackageProduct of updatedPackageProducts) {
    const packageProductIndex = packageDetails.products.findIndex(
      (packageItem) => packageItem.product.id === updatedPackageProduct.productId
    );
    if (packageProductIndex !== -1) {
      packageDetails.products[packageProductIndex].quantity = updatedPackageProduct.quantity;
    } else {
      const productItem = await productRepository.findOneBy({ id: updatedPackageProduct.productId });
      if (productItem) {
        const prod = new PackageProduct();
        prod.package = packageDetails;
        prod.quantity = updatedPackageProduct.quantity;
        prod.product = productItem;

        packageDetails.products.push(prod);
      }
    }
  }

  if (packageDetails.products.length === 0) {
    return res.status(400).json({ message: "Package must contain products." });
  }

  await packageRepository.save(packageDetails);

  const images = req.files as Express.Multer.File[];
  await uploadPackageImages(images, imagesOrder, packageDetails);

  return res.status(201).json({ message: "Package updated!" });
};

export const deletePackageImage = async (req: Request, res: Response, next: NextFunction) => {
  const imageId = req.params.imageId;
  const packageId = req.params.packageId;

  const packageImage = await packageImageRepository.findOne({
    where: { id: Number(imageId) },
    relations: {
      package: {
        images: true,
      },
    },
  });

  if (!packageImage || packageImage.package.id.toString() !== packageId) {
    return res.status(400).json({ message: "Invalid request!" });
  }

  const folderPath = path.join(PACKAGE_IMG_FOLDER, packageImage.package.id.toString());
  const filePath = path.join(folderPath, packageImage.filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await packageImageRepository.remove(packageImage);

  packageImage.package.images.forEach(async (image) => {
    if (image.order > packageImage.order) {
      await packageImageRepository.save({ ...image, order: image.order - 1 });
    }
  });

  return res.status(204).json({ message: "Package image deleted" });
};

const uploadPackageImages = async (images: Express.Multer.File[], imagesOrder: string, packageDetails: Package) => {
  if (images && images.length) {
    const imgOrder = JSON.parse(imagesOrder);
    const folderPath = path.join(PACKAGE_IMG_FOLDER, packageDetails.id.toString());

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    for (const image of images) {
      const imageHash = randomHash(6);
      const imageName = `${imageHash}.${image.originalname.split(".").pop()}`;

      await uploadImage(image.buffer, folderPath, imageName);

      const packageImage = new PackageImage();
      packageImage.package = packageDetails;
      packageImage.filename = imageName;
      packageImage.order = imgOrder[image.originalname];

      packageImageRepository.save(packageImage);
    }
  }
};

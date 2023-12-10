import { NextFunction, Request, Response } from "express";
import { PaginationQuery } from "../types";
import MysqlDataSource from "../config/data-source";
import { Order } from "../entity/Order";
import { paginatedResult } from "../utils";

const orderRepository = MysqlDataSource.getRepository(Order);

export const getOrders = async (req: Request<{}, {}, {}, PaginationQuery>, res: Response, next: NextFunction) => {
  const { page, perPage } = req.query;

  let pag = 1;
  let limit = 10;
  if (perPage && !isNaN(parseInt(perPage)) && parseInt(perPage) > 0) {
    limit = parseInt(perPage);
  }
  if (page && !isNaN(parseInt(page)) && parseInt(page) > 0) {
    pag = parseInt(page);
  }
  const skip = limit * pag - limit;

  const orders = await orderRepository.find({
    relations: {
      products: true,
      packages: true,
    },
    order: { status: "ASC", id: "DESC" },
    take: limit,
    skip: skip,
  });
  const countFilteredOrders = await orderRepository.find();

  return res.status(200).json(paginatedResult(orders, countFilteredOrders.length, limit));
};

export const createOrder = async () => {};

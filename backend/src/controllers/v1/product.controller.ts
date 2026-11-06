import type { Request, Response, NextFunction } from "express";
import productService from "@services/product/product.service";
import responseHelper from "@shared-helpers/response.helper";

class ProductController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const product = await productService.create(
        req.auth!.businessId,
        req.auth!.userId,
        res.locals.validated.body,
      );

      responseHelper.success(
        res,
        "Product created successfully.",
        product,
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.getAll(
        req.auth!.businessId,
        res.locals.validated.query,
      );

      responseHelper.success(res, "Products retrieved successfully.", result);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const product = await productService.getById(
        req.auth!.businessId,
        res.locals.validated.params.id,
      );

      responseHelper.success(res, "Product retrieved successfully.", product);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.update(
        req.auth!.businessId,
        res.locals.validated.params.id,
        res.locals.validated.body,
      );

      responseHelper.success(res, "Product updated successfully.", product);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.remove(
        req.auth!.businessId,
        res.locals.validated.params.id,
      );

      responseHelper.success(res, "Product deactivated successfully.", product);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();

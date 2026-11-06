import type { Request, Response, NextFunction } from "express";

import productVariantService from "@services/product/product-variant.service";
import responseHelper from "@shared-helpers/response.helper";

class ProductVariantController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variant = await productVariantService.create(
        req.auth!.businessId,
        req.auth!.userId,
        res.locals.validated.params.id,
        res.locals.validated.body,
      );

      responseHelper.success(
        res,
        "Product variant created successfully.",
        variant,
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async bulkCreate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const variants = await productVariantService.bulkCreate(
        req.auth!.businessId,
        req.auth!.userId,
        res.locals.validated.params.id,
        res.locals.validated.body.variants,
      );

      responseHelper.success(
        res,
        "Product variants created successfully.",
        variants,
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variants = await productVariantService.getAll(
        req.auth!.businessId,
        res.locals.validated.params.id,
        res.locals.validated.query.status,
      );

      responseHelper.success(
        res,
        "Product variants retrieved successfully.",
        variants,
      );
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
      const variant = await productVariantService.getById(
        req.auth!.businessId,
        res.locals.validated.params.id,
        res.locals.validated.params.variantId,
      );

      responseHelper.success(
        res,
        "Product variant retrieved successfully.",
        variant,
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variant = await productVariantService.update(
        req.auth!.businessId,
        res.locals.validated.params.id,
        res.locals.validated.params.variantId,
        res.locals.validated.body,
      );

      responseHelper.success(
        res,
        "Product variant updated successfully.",
        variant,
      );
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variant = await productVariantService.remove(
        req.auth!.businessId,
        res.locals.validated.params.id,
        res.locals.validated.params.variantId,
      );

      responseHelper.success(
        res,
        "Product variant deactivated successfully.",
        variant,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductVariantController();

import type { Request, Response, NextFunction } from "express";

import productImageService from "@services/product/product-image.service";
import responseHelper from "@shared-helpers/response.helper";
import AppError from "@shared-errors/app.error";

class ProductImageController {
  async upload(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.auth || !req.file) {
        throw new AppError(
          "Authentication and product image file are required",
          400,
        );
      }

      const result = await productImageService.upload({
        productId: req.params.id as string,
        businessId: req.auth.businessId,
        buffer: req.file.buffer,
      });

      responseHelper.success(
        res,
        "Product image uploaded successfully.",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async remove(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.auth) {
        throw new AppError("Authentication required", 401);
      }

      const result = await productImageService.remove(
        req.params.id as string,
        req.auth.businessId,
      );

      responseHelper.success(
        res,
        "Product image removed successfully.",
        result,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductImageController();

import type { Request, Response, NextFunction } from "express";
import categoryService from "@services/category/category.service";
import responseHelper from "@shared-helpers/response.helper";

class CategoryController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.create(
        req.auth!.businessId,
        res.locals.validated.body
      );

      responseHelper.success(res, "Category created successfully.", category, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryService.getAll(
        req.auth!.businessId,
        res.locals.validated.query
      );

      responseHelper.success(res, "Categories retrieved successfully.", categories);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.update(
        req.auth!.businessId,
        res.locals.validated.params.id,
        res.locals.validated.body
      );

      responseHelper.success(res, "Category updated successfully.", category);
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.deactivate(
        req.auth!.businessId,
        res.locals.validated.params.id
      );

      responseHelper.success(res, "Category deactivated successfully.", category);
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();

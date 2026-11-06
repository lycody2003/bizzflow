import type { Request, Response, NextFunction } from "express";

import inventoryService from "@services/inventory/inventory.service";
import responseHelper from "@shared-helpers/response.helper";

class InventoryController {
  async adjust(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const movement = await inventoryService.adjust(
        req.auth!.businessId,
        req.auth!.userId,
        res.locals.validated.body,
      );

      responseHelper.success(
        res,
        "Stock adjusted successfully.",
        movement,
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await inventoryService.getAll(
        req.auth!.businessId,
        res.locals.validated.query,
      );

      responseHelper.success(
        res,
        "Inventory retrieved successfully.",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async getMovements(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await inventoryService.getMovements(
        req.auth!.businessId,
        res.locals.validated.query,
      );

      responseHelper.success(
        res,
        "Stock movements retrieved successfully.",
        result,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new InventoryController();

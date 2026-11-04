import type { Request, Response, NextFunction } from "express";

import unitService from "@services/unit/unit.service";
import responseHelper from "@shared-helpers/response.helper";

class UnitController {
  async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const unit = await unitService.create(
        req.auth!.businessId,
        res.locals.validated.body,
      );

      return responseHelper.success(
        res,
        "Unit created successfully.",
        unit,
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
  ) {
    try {
      const units = await unitService.getAll(
        req.auth!.businessId,
        res.locals.validated.query,
      );

      return responseHelper.success(
        res,
        "Units retrieved successfully.",
        units,
      );
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const unit = await unitService.update(
        req.auth!.businessId,
        res.locals.validated.params.id,
        res.locals.validated.body,
      );

      return responseHelper.success(
        res,
        "Unit updated successfully.",
        unit,
      );
    } catch (error) {
      next(error);
    }
  }

  async deactivate(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const unit = await unitService.deactivate(
        req.auth!.businessId,
        res.locals.validated.params.id,
      );

      return responseHelper.success(
        res,
        "Unit deactivated successfully.",
        unit,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new UnitController();

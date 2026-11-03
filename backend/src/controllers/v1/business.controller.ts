import type { Request, Response, NextFunction } from "express";

import businessService from "@services/business/business.service";
import responseHelper from "@shared-helpers/response.helper";

class BusinessController {
  getMyBusiness = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const business = await businessService.getMyBusiness(
        req.auth!.userId,
        req.auth!.businessId,
      );

      responseHelper.success(
        res,
        "Business retrieved successfully",
        business,
      );
    } catch (error) {
      next(error);
    }
  };

  updateMyBusiness = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const business = await businessService.updateMyBusiness(
        req.auth!.userId,
        req.auth!.businessId,
        res.locals.validated.body,
      );

      responseHelper.success(
        res,
        "Business updated successfully",
        business,
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new BusinessController();
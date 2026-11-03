
import type { Request, Response, NextFunction } from "express";

import businessLogoService from "@services/business/business-logo.service";
import responseHelper from "@shared-helpers/response.helper";
import AppError from "@shared-errors/app.error";

class BusinessLogoController {
  async upload(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.auth || !req.file) {
        throw new AppError("Authentication and logo file are required", 400);
      }

      const result = await businessLogoService.uploadLogo({
        businessId: req.auth.businessId,
        userId: req.auth.userId,
        buffer: req.file.buffer,
      });

      responseHelper.success(
        res,
        "Business logo uploaded successfully",
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

      const result = await businessLogoService.removeLogo(
        req.auth.businessId,
        req.auth.userId,
      );

      responseHelper.success(
        res,
        "Business logo removed successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new BusinessLogoController();

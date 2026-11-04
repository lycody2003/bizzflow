import type { Request, Response, NextFunction } from "express";

import dashboardService from "@services/dashboard/dashboard.service";
import responseHelper from "@shared-helpers/response.helper";

class DashboardController {
  getOverview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const overview = await dashboardService.getOverview(
        req.auth!.businessId,
      );

      responseHelper.success(
        res,
        "Dashboard overview retrieved successfully.",
        overview,
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new DashboardController();

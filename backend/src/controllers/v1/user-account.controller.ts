import type { Request, Response, NextFunction } from "express";

import userAccountService from "@services/user/user-account.service";
import responseHelper from "@shared-helpers/response.helper";
import AppError from "@shared-errors/app.error";

class UserAccountController {
  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.auth) {
        throw new AppError("Authentication required", 401);
      }

      const result = await userAccountService.updateProfile({
        userId: req.auth.userId,
        ...res.locals.validated.body,
      });

      responseHelper.success(
        res,
        "Profile updated successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.auth) {
        throw new AppError("Authentication required", 401);
      }

      await userAccountService.changePassword({
        userId: req.auth.userId,
        ...res.locals.validated.body,
      });

      responseHelper.success(
        res,
        "Password changed successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new UserAccountController();
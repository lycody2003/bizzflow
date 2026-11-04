
import type { Request, Response, NextFunction } from "express";

import userAvatarService from "@services/user/user-avatar.service";
import responseHelper from "@shared-helpers/response.helper";
import AppError from "@shared-errors/app.error";

class UserAvatarController {
  async upload(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.auth || !req.file) {
        throw new AppError(
          "Authentication and avatar file are required",
          400,
        );
      }

      const result = await userAvatarService.uploadAvatar({
        userId: req.auth.userId,
        buffer: req.file.buffer,
      });

      responseHelper.success(
        res,
        "User avatar uploaded successfully",
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

      const result = await userAvatarService.removeAvatar(
        req.auth.userId,
      );

      responseHelper.success(
        res,
        "User avatar removed successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new UserAvatarController();

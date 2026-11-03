import type { Request, Response, NextFunction } from "express";

import tokenService from "@services/auth/token.service";
import User from "@models/user.model";
import AppError from "@shared-errors/app.error";

class AuthMiddleware {
  async authenticate(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authorization = req.headers.authorization;

      if (!authorization?.startsWith("Bearer ")) {
        throw new AppError("Authentication required", 401);
      }

      const accessToken = authorization.slice(7);
      const payload = tokenService.verifyAccessToken(accessToken);

      const user = await User.findById(payload.userId);

      if (!user || user.status !== "active") {
        throw new AppError("User account is not available", 401);
      }

      if (!user.businessId) {
        throw new AppError("User business is not available", 403);
      }

      req.auth = {
        userId: user._id.toString(),
        email: user.email,
        businessId: user.businessId.toString(),
      };

      next();
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthMiddleware();
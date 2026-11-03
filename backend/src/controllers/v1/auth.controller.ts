import type { Request, Response, NextFunction } from "express";

import authService from "@services/auth/auth.service";
import responseHelper from "@shared-helpers/response.helper";
import cookieConfig from "@configs/cookie";
import configEnv from "@configs/env";
import AppError from "@shared-errors/app.error";

class AuthController {
  private readonly refreshCookieMaxAge = configEnv.JWT_REFRESH_EXPIRES_IN_MS;

  private setRefreshCookie = (res: Response, token: string): void => {
    res.cookie("refreshToken", token, {
      ...cookieConfig.refreshToken,
      maxAge: this.refreshCookieMaxAge,
    });
  };

  private clearRefreshCookie = (res: Response): void => {
    res.clearCookie("refreshToken", cookieConfig.refreshToken);
  };

  register = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await authService.register(res.locals.validated.body);

      this.setRefreshCookie(res, result.refreshToken);

      const { refreshToken, ...responseData } = result;

      responseHelper.success(res, "Registration successful", responseData, 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await authService.login(res.locals.validated.body);

      this.setRefreshCookie(res, result.refreshToken);

      const { refreshToken, ...responseData } = result;

      responseHelper.success(res, "Login successful", responseData);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        this.clearRefreshCookie(res);
        throw new AppError("Refresh token is required", 401);
      }

      const result = await authService.refresh(refreshToken);

      this.setRefreshCookie(res, result.refreshToken);

      const { refreshToken: newRefreshToken, ...responseData } = result;

      responseHelper.success(res, "Token refreshed successfully", responseData);
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      this.clearRefreshCookie(res);

      responseHelper.success(res, "Logout successful");
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await authService.getCurrentUser(req.auth!.userId);

      responseHelper.success(res, "User retrieved successfully", user);
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();

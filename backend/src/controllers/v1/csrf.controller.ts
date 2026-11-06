import type { Request, Response, NextFunction } from "express";

import csrfService from "@services/auth/csrf.service";
import responseHelper from "@shared-helpers/response.helper";
import configEnv from "@configs/env";

class CsrfController {
  async getToken(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const existingToken = _req.cookies?.csrfToken;

      const token =
        typeof existingToken === "string" &&
        csrfService.verifyToken(existingToken)
          ? existingToken
          : csrfService.generateToken();

      const cookieOptions = {
        httpOnly: false,
        secure: configEnv.IS_PRODUCTION,
        sameSite: "lax" as const,
        path: configEnv.API_BASE_PATH,
        ...(configEnv.IS_PRODUCTION && {
          domain: ".bizzflow.com",
        }),
        maxAge: 60 * 60 * 1000,
      };

      // Remove the legacy cookie created with the old auth-only path.
      res.clearCookie("csrfToken", {
        path: "/api/v1/auth",
        ...(configEnv.IS_PRODUCTION && {
          domain: ".bizzflow.com",
        }),
      });

      // Reuse a valid token and renew its cookie expiration.
      res.cookie("csrfToken", token, cookieOptions);

      responseHelper.success(res, "CSRF token generated successfully", {
        csrfToken: token,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CsrfController();

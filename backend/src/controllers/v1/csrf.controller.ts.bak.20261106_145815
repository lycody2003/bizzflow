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
      const token = csrfService.generateToken();

      const oldCookieOptions = {
        path: "/api/v1/auth",
        ...(configEnv.IS_PRODUCTION && {
          domain: ".bizzflow.com",
        }),
      };

      res.clearCookie("csrfToken", oldCookieOptions);

      res.cookie("csrfToken", token, {
        httpOnly: false,
        secure: configEnv.IS_PRODUCTION,
        sameSite: "lax",
        path: configEnv.API_BASE_PATH,
        ...(configEnv.IS_PRODUCTION && {
          domain: ".bizzflow.com",
        }),
        maxAge: 60 * 60 * 1000,
      });

      responseHelper.success(res, "CSRF token generated successfully", {
        csrfToken: token,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CsrfController();

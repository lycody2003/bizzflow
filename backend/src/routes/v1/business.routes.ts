
import { Router } from "express";

import businessController from "@controllers/v1/business.controller";
import businessLogoController from "@controllers/v1/business-logo.controller";

import authMiddleware from "@middlewares/auth.middleware";
import csrfMiddleware from "@middlewares/csrf.middleware";
import businessLogoUploadMiddleware from "@middlewares/business-logo-upload.middleware";

import validateMiddleware from "@middlewares/validate.middleware";
import businessValidation from "@validations/business.validation";

class BusinessRoutes {
  public readonly router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authMiddleware.authenticate);

    this.router.get("/me", businessController.getMyBusiness);

    this.router.patch(
      "/me",
      csrfMiddleware.protect,
      validateMiddleware.validate(businessValidation.update),
      businessController.updateMyBusiness,
    );

    this.router.put(
      "/me/logo",
      csrfMiddleware.protect,
      businessLogoUploadMiddleware.upload,
      businessLogoController.upload,
    );

    this.router.delete(
      "/me/logo",
      csrfMiddleware.protect,
      businessLogoController.remove,
    );
  }
}

export default new BusinessRoutes().router;

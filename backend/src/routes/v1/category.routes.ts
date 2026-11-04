import { Router } from "express";

import categoryController from "@controllers/v1/category.controller";
import authMiddleware from "@middlewares/auth.middleware";
import csrfMiddleware from "@middlewares/csrf.middleware";
import validateMiddleware from "@middlewares/validate.middleware";
import categoryValidation from "@validations/category.validation";

class CategoryRoutes {
  public readonly router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authMiddleware.authenticate);

    this.router.get(
      "/",
      validateMiddleware.validate(categoryValidation.getAll),
      categoryController.getAll,
    );

    this.router.post(
      "/",
      csrfMiddleware.protect,
      validateMiddleware.validate(categoryValidation.create),
      categoryController.create,
    );

    this.router.patch(
      "/:id",
      csrfMiddleware.protect,
      validateMiddleware.validate(categoryValidation.update),
      categoryController.update,
    );

    this.router.delete(
      "/:id",
      csrfMiddleware.protect,
      validateMiddleware.validate(categoryValidation.getById),
      categoryController.deactivate,
    );
  }
}

export default new CategoryRoutes().router;

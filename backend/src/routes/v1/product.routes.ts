import { Router } from "express";

import productController from "@controllers/v1/product.controller";
import productImageController from "@controllers/v1/product-image.controller";
import productImageUploadMiddleware from "@middlewares/product-image-upload.middleware";
import authMiddleware from "@middlewares/auth.middleware";
import csrfMiddleware from "@middlewares/csrf.middleware";
import validateMiddleware from "@middlewares/validate.middleware";
import productValidation from "@validations/product.validation";

class ProductRoutes {
  public readonly router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authMiddleware.authenticate);

    this.router.post(
      "/",
      csrfMiddleware.protect,
      validateMiddleware.validate(productValidation.create),
      productController.create
    );

    this.router.get(
      "/",
      validateMiddleware.validate(productValidation.getAll),
      productController.getAll
    );

    this.router.get(
      "/:id",
      validateMiddleware.validate(productValidation.getById),
      productController.getById
    );

    this.router.patch(
      "/:id",
      csrfMiddleware.protect,
      validateMiddleware.validate(productValidation.update),
      productController.update
    );

    this.router.put(
      "/:id/image",
      csrfMiddleware.protect,
      productImageUploadMiddleware.upload,
      validateMiddleware.validate(productValidation.getById),
      productImageController.upload
    );

    this.router.delete(
      "/:id/image",
      csrfMiddleware.protect,
      validateMiddleware.validate(productValidation.getById),
      productImageController.remove
    );

    this.router.delete(
      "/:id",
      csrfMiddleware.protect,
      validateMiddleware.validate(productValidation.getById),
      productController.remove
    );
  }
}

export default new ProductRoutes().router;

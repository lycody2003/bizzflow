import { Router } from "express";

import productController from "@controllers/v1/product.controller";
import productVariantController from "@controllers/v1/product-variant.controller";
import productVariantValidation from "@validations/product-variant.validation";
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
      productController.create,
    );

    this.router.post(
      "/:id/variants/bulk",
      csrfMiddleware.protect,
      validateMiddleware.validate(productVariantValidation.bulkCreate),
      productVariantController.bulkCreate,
    );

    this.router.post(
      "/:id/variants",
      csrfMiddleware.protect,
      validateMiddleware.validate(productVariantValidation.create),
      productVariantController.create,
    );

    this.router.get(
      "/:id/variants",
      validateMiddleware.validate(productVariantValidation.getAll),
      productVariantController.getAll,
    );

    this.router.get(
      "/:id/variants/:variantId",
      validateMiddleware.validate(productVariantValidation.getById),
      productVariantController.getById,
    );

    this.router.patch(
      "/:id/variants/:variantId",
      csrfMiddleware.protect,
      validateMiddleware.validate(productVariantValidation.update),
      productVariantController.update,
    );

    this.router.delete(
      "/:id/variants/:variantId",
      csrfMiddleware.protect,
      validateMiddleware.validate(productVariantValidation.getById),
      productVariantController.remove,
    );

    this.router.get(
      "/",
      validateMiddleware.validate(productValidation.getAll),
      productController.getAll,
    );

    this.router.get(
      "/:id",
      validateMiddleware.validate(productValidation.getById),
      productController.getById,
    );

    this.router.patch(
      "/:id",
      csrfMiddleware.protect,
      validateMiddleware.validate(productValidation.update),
      productController.update,
    );

    this.router.put(
      "/:id/image",
      csrfMiddleware.protect,
      productImageUploadMiddleware.upload,
      validateMiddleware.validate(productValidation.getById),
      productImageController.upload,
    );

    this.router.delete(
      "/:id/image",
      csrfMiddleware.protect,
      validateMiddleware.validate(productValidation.getById),
      productImageController.remove,
    );

    this.router.delete(
      "/:id",
      csrfMiddleware.protect,
      validateMiddleware.validate(productValidation.getById),
      productController.remove,
    );
  }
}

export default new ProductRoutes().router;

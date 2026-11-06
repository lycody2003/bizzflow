import { Router } from "express";

import inventoryController from "@controllers/v1/inventory.controller";
import inventoryValidation from "@validations/inventory.validation";
import authMiddleware from "@middlewares/auth.middleware";
import csrfMiddleware from "@middlewares/csrf.middleware";
import validateMiddleware from "@middlewares/validate.middleware";

class InventoryRoutes {
  public readonly router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authMiddleware.authenticate);

    this.router.get(
      "/",
      validateMiddleware.validate(inventoryValidation.getAll),
      inventoryController.getAll,
    );

    this.router.post(
      "/adjustments",
      csrfMiddleware.protect,
      validateMiddleware.validate(inventoryValidation.adjust),
      inventoryController.adjust,
    );

    this.router.get(
      "/movements",
      validateMiddleware.validate(inventoryValidation.getMovements),
      inventoryController.getMovements,
    );
  }
}

export default new InventoryRoutes().router;

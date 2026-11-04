import { Router } from "express";

import unitController from "@controllers/v1/unit.controller";
import authMiddleware from "@middlewares/auth.middleware";
import csrfMiddleware from "@middlewares/csrf.middleware";
import validateMiddleware from "@middlewares/validate.middleware";

import {
  createUnitSchema,
  getUnitsSchema,
  updateUnitSchema,
  unitIdParamSchema,
} from "@validations/unit.validation";

class UnitRoutes {
  public readonly router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authMiddleware.authenticate);

    this.router.get(
      "/",
      validateMiddleware.validate(getUnitsSchema),
      unitController.getAll,
    );

    this.router.post(
      "/",
      csrfMiddleware.protect,
      validateMiddleware.validate(createUnitSchema),
      unitController.create,
    );

    this.router.patch(
      "/:id",
      csrfMiddleware.protect,
      validateMiddleware.validate(updateUnitSchema),
      unitController.update,
    );

    this.router.delete(
      "/:id",
      csrfMiddleware.protect,
      validateMiddleware.validate(unitIdParamSchema),
      unitController.deactivate,
    );
  }
}

export default new UnitRoutes().router;

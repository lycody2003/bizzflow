import { Router } from "express";

import dashboardController from "@controllers/v1/dashboard.controller";
import authMiddleware from "@middlewares/auth.middleware";

class DashboardRoutes {
  public readonly router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authMiddleware.authenticate);

    this.router.get("/overview", dashboardController.getOverview);
  }
}

export default new DashboardRoutes().router;

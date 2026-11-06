import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import configEnv from "@configs/env";

import healthRoutes from "@routes/v1/health.routes";
import authRoutes from "@routes/v1/auth.routes";
import csrfRoutes from "@routes/v1/csrf.routes";
import businessRoutes from "@routes/v1/business.routes";
import userRoutes from "@routes/v1/user.routes";
import productRoutes from "@routes/v1/product.routes";
import inventoryRoutes from "@routes/v1/inventory.routes";
import categoryRoutes from "@routes/v1/category.routes";
import unitRoutes from "@routes/v1/unit.routes";
import dashboardRoutes from "@routes/v1/dashboard.routes";

import notFoundMiddleware from "@middlewares/not-found.middleware";
import errorMiddleware from "@middlewares/error.middleware";

class App {
  public readonly app = express();

  constructor() {
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeNotFound();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());

    this.app.use(
      cors({
        origin: configEnv.CORS_ORIGINS,
        credentials: true,
      }),
    );

    this.app.use(morgan("dev"));
    this.app.use(express.json({ limit: "1mb" }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(): void {
    this.app.use(`${configEnv.API_BASE_PATH}/health`, healthRoutes);
    this.app.use(`${configEnv.API_BASE_PATH}/csrf`, csrfRoutes);
    this.app.use(`${configEnv.API_BASE_PATH}/auth`, authRoutes);
    this.app.use(`${configEnv.API_BASE_PATH}/businesses`, businessRoutes);
    this.app.use(`${configEnv.API_BASE_PATH}/users`, userRoutes);
    this.app.use(`${configEnv.API_BASE_PATH}/products`, productRoutes);
    this.app.use(`${configEnv.API_BASE_PATH}/inventory`, inventoryRoutes);
    this.app.use(`${configEnv.API_BASE_PATH}/categories`, categoryRoutes);
    this.app.use(`${configEnv.API_BASE_PATH}/units`, unitRoutes);
    this.app.use(`${configEnv.API_BASE_PATH}/dashboard`, dashboardRoutes);
  }

  private initializeNotFound(): void {
    this.app.use(notFoundMiddleware.handle);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware.handle);
  }
}

export default new App().app;

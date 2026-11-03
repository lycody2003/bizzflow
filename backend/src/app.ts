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
  }

  private initializeNotFound(): void {
    this.app.use(notFoundMiddleware.handle);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware.handle);
  }
}

export default new App().app;

import "dotenv/config";
import { z } from "zod";

class ConfigEnv {
  private readonly schema = z.object({
    APP_NAME: z.string().trim().min(1).default("BizzFlow"),
    APP_VERSION: z.string().trim().min(1).default("1.0.0"),

    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    PORT: z.coerce.number().int().min(1).max(65535).default(5050),

    API_PREFIX: z
      .string()
      .default("/api")
      .transform((value) => `/${value.replace(/^\/+|\/+$/g, "")}`),

    API_VERSION: z
      .string()
      .default("v1")
      .transform((value) => value.replace(/^\/+|\/+$/g, "")),

    MONGODB_URI: z.string().trim().min(1),
    MONGODB_DATABASE: z.string().trim().min(1).default("bizzflow"),
    MONGODB_TEST_DATABASE: z.string().trim().min(1).default("bizzflow_test"),

    CORS_ORIGIN: z.string().default("http://localhost:3003"),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),
    JWT_REFRESH_EXPIRES_IN_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(2),

    CSRF_SECRET: z.string().min(32),

    CLOUDINARY_CLOUD_NAME: z.string().trim().min(1),
    CLOUDINARY_API_KEY: z.string().trim().min(1),
    CLOUDINARY_API_SECRET: z.string().trim().min(1),
  });

  private readonly config = this.validate();

  private validate() {
    const result = this.schema.safeParse(process.env);

    if (!result.success) {
      console.error("Invalid environment configuration:");
      console.error(z.treeifyError(result.error));
      process.exit(1);
    }

    return result.data;
  }

  get APP_NAME() {
    return this.config.APP_NAME;
  }

  get APP_VERSION() {
    return this.config.APP_VERSION;
  }

  get NODE_ENV() {
    return this.config.NODE_ENV;
  }

  get PORT() {
    return this.config.PORT;
  }

  get API_PREFIX() {
    return this.config.API_PREFIX;
  }

  get API_VERSION() {
    return this.config.API_VERSION;
  }

  get API_BASE_PATH() {
    return `${this.config.API_PREFIX}/${this.config.API_VERSION}`;
  }

  get MONGODB_URI() {
    return this.config.MONGODB_URI;
  }

  get MONGODB_DATABASE() {
    return this.config.MONGODB_DATABASE;
  }

  get MONGODB_TEST_DATABASE() {
    return this.config.MONGODB_TEST_DATABASE;
  }

  get CORS_ORIGIN() {
    return this.config.CORS_ORIGIN;
  }

  get CORS_ORIGINS() {
    return this.config.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get JWT_ACCESS_SECRET() {
    return this.config.JWT_ACCESS_SECRET;
  }

  get JWT_ACCESS_EXPIRES_IN() {
    return this.config.JWT_ACCESS_EXPIRES_IN;
  }

  get JWT_REFRESH_EXPIRES_IN_DAYS() {
    return this.config.JWT_REFRESH_EXPIRES_IN_DAYS;
  }

  get JWT_REFRESH_EXPIRES_IN_MINUTES() {
    return this.config.JWT_REFRESH_EXPIRES_IN_MINUTES;
  }

  get JWT_REFRESH_EXPIRES_IN_MS() {
    const duration = this.IS_PRODUCTION
      ? this.config.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
      : this.config.JWT_REFRESH_EXPIRES_IN_MINUTES * 60 * 1000;

    return duration;
  }

  get CSRF_SECRET() {
    return this.config.CSRF_SECRET;
  }

  get IS_PRODUCTION() {
    return this.config.NODE_ENV === "production";
  }

  get IS_DEVELOPMENT() {
    return this.config.NODE_ENV === "development";
  }

  get IS_TEST() {
    return this.config.NODE_ENV === "test";
  }

  get CLOUDINARY_CLOUD_NAME() {
    return this.config.CLOUDINARY_CLOUD_NAME;
  }

  get CLOUDINARY_API_KEY() {
    return this.config.CLOUDINARY_API_KEY;
  }

  get CLOUDINARY_API_SECRET() {
    return this.config.CLOUDINARY_API_SECRET;
  }
}

export default new ConfigEnv();


import multer from "multer";
import type { Request, Response, NextFunction } from "express";

import AppError from "@shared-errors/app.error";

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new AppError("Only JPEG, PNG, and WebP images are allowed", 400),
      );
    }

    callback(null, true);
  },
});

class BusinessLogoUploadMiddleware {
  upload(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    upload.single("logo")(req, res, (error: unknown) => {
      if (!error) {
        if (!req.file) {
          return next(new AppError("Logo file is required", 400));
        }

        return next();
      }

      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return next(new AppError("Logo must not exceed 2MB", 400));
        }

        if (error.code === "LIMIT_FILE_COUNT") {
          return next(new AppError("Only one logo file is allowed", 400));
        }

        return next(new AppError("Invalid logo upload", 400));
      }

      next(error);
    });
  }
}

export default new BusinessLogoUploadMiddleware();

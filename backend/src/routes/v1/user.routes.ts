import { Router } from "express";

import userAvatarController from "@controllers/v1/user-avatar.controller";

import authMiddleware from "@middlewares/auth.middleware";
import csrfMiddleware from "@middlewares/csrf.middleware";
import userAvatarUploadMiddleware from "@middlewares/user-avatar-upload.middleware";
import userAccountController from "@controllers/v1/user-account.controller";
import userValidation from "@validations/user.validation";
import validateMiddleware from "@middlewares/validate.middleware";

class UserRoutes {
  public readonly router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authMiddleware.authenticate);

    this.router.put(
      "/me/avatar",
      csrfMiddleware.protect,
      userAvatarUploadMiddleware.upload,
      userAvatarController.upload,
    );

    this.router.delete(
      "/me/avatar",
      csrfMiddleware.protect,
      userAvatarController.remove,
    );

    this.router.patch(
      "/me/profile",
      csrfMiddleware.protect,
      validateMiddleware.validate(userValidation.updateProfile),
      userAccountController.updateProfile,
    );

    this.router.patch(
      "/me/password",
      csrfMiddleware.protect,
      validateMiddleware.validate(userValidation.changePassword),
      userAccountController.changePassword,
    );
  }
}

export default new UserRoutes().router;

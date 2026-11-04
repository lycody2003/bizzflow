import mongoose from "mongoose";

import User from "@models/user.model";
import AppError from "@shared-errors/app.error";
import passwordService from "@services/auth/password.service";

interface UpdateProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
}

interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

class UserAccountService {
  async updateProfile(input: UpdateProfileInput) {
    if (!mongoose.isValidObjectId(input.userId)) {
      throw new AppError("User not found", 404);
    }

    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    const user = await User.findById(input.userId);

    if (!user || user.status !== "active") {
      throw new AppError("User not found", 404);
    }

    user.firstName = firstName;
    user.lastName = lastName;

    await user.save();

    return {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    if (!mongoose.isValidObjectId(input.userId)) {
      throw new AppError("User not found", 404);
    }

    const user = await User.findById(input.userId).select("+passwordHash");

    if (!user || user.status !== "active") {
      throw new AppError("User not found", 404);
    }

    const isCurrentPasswordValid =
      await passwordService.comparePassword(
        input.currentPassword,
        user.passwordHash,
      );

    if (!isCurrentPasswordValid) {
      throw new AppError("Current password is incorrect", 400);
    }

    const isSamePassword = await passwordService.comparePassword(
      input.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new AppError(
        "New password must be different from current password",
        400,
      );
    }

    user.passwordHash = await passwordService.hashPassword(
      input.newPassword,
    );

    await user.save();
  }
}

export default new UserAccountService();
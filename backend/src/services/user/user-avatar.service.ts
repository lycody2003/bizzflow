
import { Readable } from "node:stream";
import type { UploadApiResponse } from "cloudinary";

import cloudinary from "@configs/cloudinary";
import User from "@models/user.model";
import AppError from "@shared-errors/app.error";

interface UploadAvatarInput {
  userId: string;
  buffer: Buffer;
}

class UserAvatarService {
  private async uploadToCloudinary(
    buffer: Buffer,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "bizzflow/user-avatars",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          transformation: [
            {
              width: 500,
              height: 500,
              crop: "limit",
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        },
        (error, result) => {
          if (error) return reject(error);

          if (!result) {
            return reject(
              new Error("Cloudinary upload returned no result"),
            );
          }

          resolve(result);
        },
      );

      Readable.from(buffer).pipe(stream);
    });
  }

  private async deleteFromCloudinary(
    publicId: string,
  ): Promise<void> {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }
  }

  async uploadAvatar(input: UploadAvatarInput) {
    const user = await User.findById(input.userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const uploaded = await this.uploadToCloudinary(input.buffer);

    const previousPublicId = user.avatarPublicId;

    try {
      user.avatarUrl = uploaded.secure_url;
      user.avatarPublicId = uploaded.public_id;

      await user.save();
    } catch (error) {
      try {
        await this.deleteFromCloudinary(uploaded.public_id);
      } catch (cleanupError) {
        console.error("[Cloudinary Avatar Cleanup Error]:", cleanupError);
      }

      throw error;
    }

    if (previousPublicId) {
      try {
        await this.deleteFromCloudinary(previousPublicId);
      } catch (error) {
        console.error("[Old User Avatar Cleanup Error]:", error);
      }
    }

    return {
      avatarUrl: user.avatarUrl,
    };
  }

  async removeAvatar(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.avatarPublicId) {
      throw new AppError("User avatar not found", 404);
    }

    const previousPublicId = user.avatarPublicId;

    user.avatarUrl = null;
    user.avatarPublicId = null;

    await user.save();

    try {
      await this.deleteFromCloudinary(previousPublicId);
    } catch (error) {
      console.error("[User Avatar Removal Cleanup Error]:", error);
    }

    return {
      avatarUrl: null,
    };
  }
}

export default new UserAvatarService();

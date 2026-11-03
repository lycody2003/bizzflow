
import { Readable } from "node:stream";
import type { UploadApiResponse } from "cloudinary";

import cloudinary from "@configs/cloudinary";
import Business from "@models/business.model";
import AppError from "@shared-errors/app.error";

interface UploadLogoInput {
  businessId: string;
  userId: string;
  buffer: Buffer;
}

class BusinessLogoService {
  private async uploadToCloudinary(
    buffer: Buffer,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "bizzflow/business-logos",
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
            return reject(new Error("Cloudinary upload returned no result"));
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

  async uploadLogo(input: UploadLogoInput) {
    const business = await Business.findOne({
      _id: input.businessId,
      ownerId: input.userId,
    });

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    const uploaded = await this.uploadToCloudinary(input.buffer);

    const previousPublicId = business.logoPublicId;

    try {
      business.logoUrl = uploaded.secure_url;
      business.logoPublicId = uploaded.public_id;

      await business.save();
    } catch (error) {
      try {
        await this.deleteFromCloudinary(uploaded.public_id);
      } catch (cleanupError) {
        console.error(
          "[Cloudinary Cleanup Error]:",
          cleanupError,
        );
      }

      throw error;
    }

    if (previousPublicId) {
      try {
        await this.deleteFromCloudinary(previousPublicId);
      } catch (error) {
        console.error(
          "[Old Business Logo Cleanup Error]:",
          error,
        );
      }
    }

    return {
      logoUrl: business.logoUrl,
    };
  }

  async removeLogo(businessId: string, userId: string) {
    const business = await Business.findOne({
      _id: businessId,
      ownerId: userId,
    });

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    if (!business.logoPublicId) {
      throw new AppError("Business logo not found", 404);
    }

    const previousPublicId = business.logoPublicId;

    business.logoUrl = null;
    business.logoPublicId = null;

    await business.save();

    try {
      await this.deleteFromCloudinary(previousPublicId);
    } catch (error) {
      console.error(
        "[Business Logo Removal Cleanup Error]:",
        error,
      );
    }

    return {
      logoUrl: null,
    };
  }
}

export default new BusinessLogoService();

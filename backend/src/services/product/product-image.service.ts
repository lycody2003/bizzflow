import { Readable } from "node:stream";
import type { UploadApiResponse } from "cloudinary";

import cloudinary from "@configs/cloudinary";
import Product from "@models/product.model";
import AppError from "@shared-errors/app.error";

interface UploadProductImageInput {
  productId: string;
  businessId: string;
  buffer: Buffer;
}

class ProductImageService {
  private async uploadToCloudinary(
    buffer: Buffer,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "bizzflow/product-images",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          transformation: [
            {
              width: 1200,
              height: 1200,
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

  async upload(input: UploadProductImageInput) {
    const product = await Product.findOne({
      _id: input.productId,
      businessId: input.businessId,
    });

    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    const uploaded = await this.uploadToCloudinary(input.buffer);
    const previousPublicId = product.imagePublicId;

    try {
      product.imageUrl = uploaded.secure_url;
      product.imagePublicId = uploaded.public_id;

      await product.save();
    } catch (error) {
      try {
        await this.deleteFromCloudinary(uploaded.public_id);
      } catch (cleanupError) {
        console.error("[Product Image Upload Cleanup Error]:", cleanupError);
      }

      throw error;
    }

    if (previousPublicId) {
      try {
        await this.deleteFromCloudinary(previousPublicId);
      } catch (error) {
        console.error("[Old Product Image Cleanup Error]:", error);
      }
    }

    return {
      imageUrl: product.imageUrl,
    };
  }

  async remove(productId: string, businessId: string) {
    const product = await Product.findOne({
      _id: productId,
      businessId,
    });

    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    if (!product.imagePublicId) {
      throw new AppError("Product image not found.", 404);
    }

    const previousPublicId = product.imagePublicId;

    product.imageUrl = null;
    product.imagePublicId = null;

    await product.save();

    try {
      await this.deleteFromCloudinary(previousPublicId);
    } catch (error) {
      console.error("[Product Image Removal Cleanup Error]:", error);
    }

    return {
      imageUrl: null,
    };
  }
}

export default new ProductImageService();

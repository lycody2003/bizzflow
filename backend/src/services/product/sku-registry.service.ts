import mongoose, { type ClientSession, type Types } from "mongoose";

import SkuRegistry, {
  type SkuReferenceType,
} from "@models/sku-registry.model";

import AppError from "@shared-errors/app.error";

interface RegisterSkuInput {
  businessId: Types.ObjectId;
  sku: string;
  referenceType: SkuReferenceType;
  referenceId: Types.ObjectId;
}

class SkuRegistryService {
  private normalizeSku(sku: string): string {
    return sku.trim().toUpperCase();
  }

  async register(
    input: RegisterSkuInput,
    session: ClientSession,
  ): Promise<void> {
    const sku = this.normalizeSku(input.sku);

    if (!sku) {
      throw new AppError("SKU is required", 400);
    }

    try {
      await SkuRegistry.create(
        [
          {
            businessId: input.businessId,
            sku,
            referenceType: input.referenceType,
            referenceId: input.referenceId,
          },
        ],
        { session },
      );
    } catch (error: unknown) {
      if (
        error instanceof mongoose.mongo.MongoServerError &&
        error.code === 11000
      ) {
        throw new AppError("SKU already exists", 409);
      }

      throw error;
    }
  }

  async update(
    input: RegisterSkuInput,
    session: ClientSession,
  ): Promise<void> {
    const sku = this.normalizeSku(input.sku);

    if (!sku) {
      throw new AppError("SKU is required", 400);
    }

    try {
      const result = await SkuRegistry.findOneAndUpdate(
        {
          businessId: input.businessId,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
        },
        {
          $set: { sku },
        },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!result) {
        throw new AppError("SKU registry record not found", 404);
      }
    } catch (error: unknown) {
      if (
        error instanceof mongoose.mongo.MongoServerError &&
        error.code === 11000
      ) {
        throw new AppError("SKU already exists", 409);
      }

      throw error;
    }
  }

  async release(
    input: Pick<
      RegisterSkuInput,
      "businessId" | "referenceType" | "referenceId"
    >,
    session: ClientSession,
  ): Promise<void> {
    await SkuRegistry.deleteOne(
      {
        businessId: input.businessId,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      },
      { session },
    );
  }
}

export default new SkuRegistryService();

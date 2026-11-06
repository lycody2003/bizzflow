import mongoose from "mongoose";

import Product from "@models/product.model";
import ProductVariant from "@models/product-variant.model";
import InventoryBalance from "@models/inventory-balance.model";
import StockMovement from "@models/stock-movement.model";
import AppError from "@shared-errors/app.error";

interface AdjustmentInput {
  productId: string;
  variantId?: string;
  type: "adjustment_in" | "adjustment_out";
  quantity: number;
  reason: string;
  idempotencyKey: string;
}

interface InventoryFilters {
  productId?: string;
  variantId?: string;
  page?: number;
  limit?: number;
}

interface MovementFilters extends InventoryFilters {
  type?: "opening" | "adjustment_in" | "adjustment_out";
}

class InventoryService {
  private isSameAdjustmentRequest(
    movement: InstanceType<typeof StockMovement>,
    input: AdjustmentInput,
  ): boolean {
    return (
      movement.productId.toString() === input.productId.toLowerCase() &&
      (movement.variantId?.toString() ?? "") ===
        (input.variantId?.toLowerCase() ?? "") &&
      movement.type === input.type &&
      movement.quantity === input.quantity &&
      movement.reason === input.reason
    );
  }

  private isBalanceUniqueConflict(error: unknown): boolean {
    return (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000 &&
      error.message.includes("business_product_variant_unique")
    );
  }

  async adjust(
    businessId: string,
    userId: string,
    input: AdjustmentInput,
  ) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const session = await mongoose.startSession();
      let result: InstanceType<typeof StockMovement> | null = null;

      try {
        await session.withTransaction(async () => {
          // 1. Check whether this request has already been processed.
          const existingMovement = await StockMovement.findOne({
            businessId,
            idempotencyKey: input.idempotencyKey,
          }).session(session);

          if (existingMovement) {
            if (!this.isSameAdjustmentRequest(existingMovement, input)) {
              throw new AppError(
                "This idempotency key has already been used for another request.",
                409,
              );
            }

            result = existingMovement;
            return;
          }

          // 2. Validate the product belongs to this business and is active.
          const product = await Product.findOne({
            _id: input.productId,
            businessId,
            status: "active",
          }).session(session);

          if (!product) {
            throw new AppError("Active product not found.", 404);
          }

          // 3. Validate the selected variant when applicable.
          if (input.variantId) {
            if (product.type !== "variant") {
              throw new AppError(
                "A variant can only belong to a variant parent product.",
                400,
              );
            }

            const variant = await ProductVariant.findOne({
              _id: input.variantId,
              productId: product._id,
              businessId,
              status: "active",
            }).session(session);

            if (!variant) {
              throw new AppError("Active product variant not found.", 404);
            }
          } else if (product.type !== "standard") {
            throw new AppError(
              "Select a specific variant before adjusting stock.",
              400,
            );
          }

          // 4. Build a business-scoped balance filter.
          const balanceFilter = {
            businessId: new mongoose.Types.ObjectId(businessId),
            productId: product._id,
            ...(input.variantId
              ? { variantId: new mongoose.Types.ObjectId(input.variantId) }
              : {}),
          };

          const delta =
            input.type === "adjustment_in"
              ? input.quantity
              : -input.quantity;

          // 5. Atomically update the balance.
          // Adjustment In can create a missing balance.
          // Adjustment Out must never create a balance or make stock negative.
          const updateFilter =
            input.type === "adjustment_out"
              ? {
                  ...balanceFilter,
                  quantityOnHand: { $gte: input.quantity },
                }
              : balanceFilter;

          const updatedBalance = await InventoryBalance.findOneAndUpdate(
            updateFilter,
            {
              $inc: { quantityOnHand: delta },
            },
            {
              new: true,
              upsert: input.type === "adjustment_in",
              session,
              runValidators: true,
              setDefaultsOnInsert: true,
            },
          );

          if (!updatedBalance) {
            throw new AppError("Insufficient stock.", 409);
          }

          // Derive both values from the result of the atomic update.
          const quantityAfter = updatedBalance.quantityOnHand;
          const quantityBefore = quantityAfter - delta;

          // 6. Create the movement in the same transaction.
          const [movement] = await StockMovement.create(
            [
              {
                ...balanceFilter,
                type: input.type,
                quantity: input.quantity,
                quantityBefore,
                quantityAfter,
                reason: input.reason,
                performedBy: new mongoose.Types.ObjectId(userId),
                idempotencyKey: input.idempotencyKey,
              },
            ],
            { session },
          );

          result = movement;
        });

        if (!result) {
          throw new AppError("Stock adjustment failed.", 500);
        }

        return result;
      } catch (error) {
        if (
          error instanceof mongoose.mongo.MongoServerError &&
          error.code === 11000
        ) {
          // A concurrent request may have committed the same idempotency key.
          const existingMovement = await StockMovement.findOne({
            businessId,
            idempotencyKey: input.idempotencyKey,
          });

          if (existingMovement) {
            if (!this.isSameAdjustmentRequest(existingMovement, input)) {
              throw new AppError(
                "This idempotency key has already been used for another request.",
                409,
              );
            }

            return existingMovement;
          }

          // A concurrent Adjustment In may have created the balance first.
          // Retry the transaction so the next attempt updates that balance.
          if (
            this.isBalanceUniqueConflict(error) &&
            attempt < maxAttempts
          ) {
            continue;
          }
        }

        throw error;
      } finally {
        await session.endSession();
      }
    }

    throw new AppError("Stock adjustment failed after multiple attempts.", 500);
  }

  async getAll(businessId: string, filters: InventoryFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const query = {
      businessId,
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.variantId ? { variantId: filters.variantId } : {}),
    };

    const [items, total] = await Promise.all([
      InventoryBalance.find(query)
        .populate("productId", "name sku type currency minimumStock")
        .populate("variantId", "sku attributes currency minimumStock")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      InventoryBalance.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMovements(businessId: string, filters: MovementFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const query = {
      businessId,
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.variantId ? { variantId: filters.variantId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
    };

    const [items, total] = await Promise.all([
      StockMovement.find(query)
        .populate("productId", "name sku type")
        .populate("variantId", "sku attributes")
        .populate("performedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      StockMovement.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new InventoryService();
